import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { SpotifyUploadService } from "@/services/upload/spotify";
import { processTrack } from "./utils";
import { UploadResponse, TrackData } from "@/services/upload/types";

const spotifyService = new SpotifyUploadService();

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");

    const songs = await prisma.song.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        title: "asc",
      },
    });
    return NextResponse.json(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    return NextResponse.json({ error: "Failed to fetch songs" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { songId, action, soundcloudData, duration } = await request.json();

    if (!songId || !action) {
      return NextResponse.json({ error: "Song ID and action are required" }, { status: 400 });
    }

    if (action === "approve") {
      if (!soundcloudData) {
        return NextResponse.json({ error: "SoundCloud data is required for approval" }, { status: 400 });
      }

      const song = await prisma.song.update({
        where: { id: songId },
        data: {
          soundcloudId: soundcloudData.id,
          permalinkUrl: soundcloudData.permalinkUrl,
          duration: soundcloudData.duration,
          status: "approved",
        },
      });

      return NextResponse.json(song);
    } else if (action === "deny") {
      const song = await prisma.song.update({
        where: { id: songId },
        data: {
          status: "denied",
        },
      });

      return NextResponse.json(song);
    } else if (action === "update") {
      if (duration === undefined) {
        return NextResponse.json({ error: "Duration is required for update" }, { status: 400 });
      }

      const song = await prisma.song.update({
        where: { id: songId },
        data: {
          duration: duration,
        },
      });

      return NextResponse.json(song);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating song:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update song" },
      { status: 500 }
    );
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
