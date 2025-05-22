import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { SpotifyUploadService } from "@/services/upload/spotify";
import { SoundCloudSearchService } from "@/services/upload/soundcloud";
import { TrackData, UploadResponse } from "@/services/upload/types";
import { Song } from "@prisma/client";

const spotifyService = new SpotifyUploadService();
const soundcloudService = new SoundCloudSearchService();

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function processTrack(
  track: TrackData,
  retryCount = 0,
  signal?: AbortSignal
): Promise<{
  song: Song | null;
  status: "success" | "failed" | "already_added";
  error?: {
    step: "spotify" | "soundcloud" | "database";
    message: string;
  };
}> {
  try {
    // Check if the request was aborted
    if (signal?.aborted) {
      throw new Error("Aborted");
    }

    // Check if song already exists
    const existingSong = await prisma.song.findUnique({
      where: { spotifyId: track.spotifyId },
    });

    if (existingSong) {
      console.log(`Song ${track.title} by ${track.artist} already exists, skipping...`);
      return {
        song: existingSong,
        status: "already_added",
      };
    }

    // Add delay between SoundCloud requests (2 seconds)
    await delay(2000);

    // Search for SoundCloud match
    const soundcloudData = await soundcloudService.searchByTitleAndArtist(track.title, track.artist);

    if (!soundcloudData) {
      return {
        song: null,
        status: "failed",
        error: {
          step: "soundcloud",
          message: `No SoundCloud match found for ${track.title} by ${track.artist}`,
        },
      };
    }

    // Only create song if we have SoundCloud metadata
    const song = await prisma.song.create({
      data: {
        spotifyId: track.spotifyId,
        soundcloudId: soundcloudData.soundcloudId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        coverUrl: track.coverUrl,
        permalinkUrl: soundcloudData.permalinkUrl,
        duration: soundcloudData.duration,
        access: soundcloudData.access || "blocked",
        status: "pending",
      },
    });

    return {
      song,
      status: "success",
    };
  } catch (error) {
    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes("rate_limit_exceeded")) {
      if (retryCount < 3) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        return processTrack(track, retryCount + 1, signal);
      }
      return {
        song: null,
        status: "failed",
        error: {
          step: "soundcloud",
          message: "Rate limit exceeded after multiple retries",
        },
      };
    }

    return {
      song: null,
      status: "failed",
      error: {
        step: "database",
        message: error instanceof Error ? error.message : "Failed to create song in database",
      },
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, type, service } = await request.json();
    const signal = request.signal;

    if (!url || !type || !service) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (service !== "spotify") {
      return NextResponse.json({ error: "Only Spotify uploads are supported at this time" }, { status: 400 });
    }

    // Get track data from Spotify
    let tracks: TrackData[];
    let playlistName: string | undefined;
    try {
      if (type === "track") {
        tracks = [await spotifyService.uploadTrack(url)];
      } else {
        const result = await spotifyService.uploadPlaylist(url);
        tracks = result.tracks;
        playlistName = result.playlistName;
      }
    } catch (error) {
      return NextResponse.json({
        message: "Failed to fetch from Spotify",
        songs: [
          {
            id: "error",
            title: "Unknown",
            artist: "Unknown",
            status: "failed",
            error: {
              step: "spotify",
              message: error instanceof Error ? error.message : "Failed to fetch from Spotify",
            },
          },
        ],
        progress: {
          processed: 0,
          total: 1,
        },
        playlistName,
      });
    }

    // Process tracks sequentially with delay to avoid rate limiting
    const processedSongs: UploadResponse["songs"] = [];
    let processedCount = 0;
    const totalSongs = tracks.length;

    for (const track of tracks) {
      try {
        // Check if the request was aborted
        if (signal?.aborted) {
          return NextResponse.json({
            message: `Upload cancelled by user. Processed ${processedCount}/${totalSongs} songs.`,
            songs: processedSongs,
            progress: {
              processed: processedCount,
              total: totalSongs,
            },
            playlistName,
          });
        }

        const { song, status, error } = await processTrack(track, 0, signal);

        processedSongs.push({
          id: song?.id || track.spotifyId,
          title: track.title,
          artist: track.artist,
          status,
          error,
        });

        processedCount++;
      } catch (error) {
        if (error instanceof Error && error.message === "Aborted") {
          return NextResponse.json({
            message: `Upload cancelled by user. Processed ${processedCount}/${totalSongs} songs.`,
            songs: processedSongs,
            progress: {
              processed: processedCount,
              total: totalSongs,
            },
            playlistName,
          });
        }

        processedSongs.push({
          id: track.spotifyId,
          title: track.title,
          artist: track.artist,
          status: "failed",
          error: {
            step: "database",
            message: error instanceof Error ? error.message : "Failed to process track",
          },
        });
        processedCount++;
      }
    }

    const successfulSongs = processedSongs.filter((song) => song.status === "success");
    const failedSongs = processedSongs.filter((song) => song.status === "failed");
    const skippedSongs = processedSongs.filter((song) => song.status === "already_added");

    return NextResponse.json({
      message: `Successfully imported ${successfulSongs.length} new song${successfulSongs.length > 1 ? "s" : ""}${
        failedSongs.length > 0 ? ` (${failedSongs.length} failed)` : ""
      }${skippedSongs.length > 0 ? ` (${skippedSongs.length} already exist)` : ""}`,
      songs: processedSongs,
      progress: {
        processed: processedCount,
        total: totalSongs,
      },
      playlistName,
    });
  } catch (error) {
    console.error("Error uploading:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to upload" }, { status: 500 });
  }
}
