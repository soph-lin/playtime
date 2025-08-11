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
      } else if (type === "playlist") {
        const result = await spotifyService.uploadPlaylist(url);
        tracks = result.tracks;
        playlistName = result.playlistName;
      } else if (type === "album") {
        const result = await spotifyService.uploadAlbum(url);
        tracks = result.tracks;
        playlistName = result.playlistName;
      } else {
        throw new Error("Invalid upload type");
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
        playlistId: undefined,
        playlistCreated: false,
      });
    }

    // Create playlist if uploading a playlist or album
    let playlistId: string | undefined;
    let playlistCreated = false;
    if ((type === "playlist" || type === "album") && playlistName) {
      try {
        const playlist = await prisma.playlist.create({
          data: {
            name: playlistName,
            createdBy: null, // Admin-created playlist
          },
        });
        playlistId = playlist.id;
        playlistCreated = true;
      } catch (error) {
        console.error("Failed to create playlist:", error);
        // Continue with song uploads even if playlist creation fails
      }
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial progress update
          const initialUpdate = {
            type: "progress",
            playlistName,
            playlistCreated,
            progress: { processed: 0, total: tracks.length },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialUpdate)}\n\n`));

          // Process tracks sequentially with real-time updates
          const processedSongs: UploadResponse["songs"] = [];
          let processedCount = 0;
          const totalSongs = tracks.length;

          for (const track of tracks) {
            try {
              // Check if the request was aborted
              if (signal?.aborted) {
                const finalUpdate = {
                  type: "complete",
                  message: `Upload cancelled by user. Processed ${processedCount}/${totalSongs} songs.`,
                  songs: processedSongs,
                  progress: { processed: processedCount, total: totalSongs },
                  playlistName,
                  playlistId,
                  playlistCreated,
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`));
                controller.close();
                return;
              }

              // Send "processing" update for current track
              const processingUpdate = {
                type: "processing",
                track: {
                  id: track.spotifyId,
                  title: track.title,
                  artist: track.artist,
                  status: "processing" as const,
                },
                progress: { processed: processedCount, total: totalSongs },
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(processingUpdate)}\n\n`));

              const { song, status, error } = await processTrack(track, 0, signal);

              const processedSong = {
                id: song?.id || track.spotifyId,
                title: track.title,
                artist: track.artist,
                status,
                error,
              };

              processedSongs.push(processedSong);
              processedCount++;

              // Send individual song result
              const songUpdate = {
                type: "song_result",
                song: processedSong,
                progress: { processed: processedCount, total: totalSongs },
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(songUpdate)}\n\n`));
            } catch (error) {
              if (error instanceof Error && error.message === "Aborted") {
                const finalUpdate = {
                  type: "complete",
                  message: `Upload cancelled by user. Processed ${processedCount}/${totalSongs} songs.`,
                  songs: processedSongs,
                  progress: { processed: processedCount, total: totalSongs },
                  playlistName,
                  playlistId,
                  playlistCreated,
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`));
                controller.close();
                return;
              }

              const failedSong = {
                id: track.spotifyId,
                title: track.title,
                artist: track.artist,
                status: "failed" as const,
                error: {
                  step: "database" as const,
                  message: error instanceof Error ? error.message : "Failed to process track",
                },
              };

              processedSongs.push(failedSong);
              processedCount++;

              // Send failed song result
              const songUpdate = {
                type: "song_result",
                song: failedSong,
                progress: { processed: processedCount, total: totalSongs },
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(songUpdate)}\n\n`));
            }
          }

          // Add successful songs to playlist if playlist was created
          if (playlistCreated && playlistId) {
            const successfulSongIds = processedSongs.filter((song) => song.status === "success").map((song) => song.id);

            if (successfulSongIds.length > 0) {
              try {
                await prisma.playlistSong.createMany({
                  data: successfulSongIds.map((songId) => ({
                    playlistId,
                    songId,
                  })),
                });
              } catch (error) {
                console.error("Failed to add songs to playlist:", error);
                // Don't fail the entire upload if playlist song addition fails
              }
            }
          }

          const successfulSongs = processedSongs.filter((song) => song.status === "success");
          const failedSongs = processedSongs.filter((song) => song.status === "failed");
          const skippedSongs = processedSongs.filter((song) => song.status === "already_added");

          const contentType = type === "playlist" ? "playlist" : type === "album" ? "album" : "track";

          // Send final completion update
          const finalUpdate = {
            type: "complete",
            message: `Successfully imported ${successfulSongs.length} new song${successfulSongs.length > 1 ? "s" : ""}${
              failedSongs.length > 0 ? ` (${failedSongs.length} failed)` : ""
            }${skippedSongs.length > 0 ? ` (${skippedSongs.length} already exist)` : ""}${
              playlistCreated ? ` and created ${contentType} "${playlistName}"` : ""
            }`,
            songs: processedSongs,
            progress: { processed: processedCount, total: totalSongs },
            playlistName,
            playlistId,
            playlistCreated,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`));
          controller.close();
        } catch (error) {
          const errorUpdate = {
            type: "error",
            error: error instanceof Error ? error.message : "Failed to process upload",
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error uploading:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to upload" }, { status: 500 });
  }
}
