import prisma from "@/lib/db";
import { SoundCloudSearchService } from "@/services/upload/soundcloud";
import { TrackData } from "@/services/upload/types";
import { Song } from "@prisma/client";

const soundcloudService = new SoundCloudSearchService();

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processTrack(
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
