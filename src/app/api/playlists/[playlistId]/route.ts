import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { PlaylistSong, Song } from "@prisma/client";

// get playlist by ID
export async function GET(request: NextRequest, context: { params: Promise<{ playlistId: string }> }) {
  try {
    const { playlistId } = await context.params;

    if (!playlistId) {
      return NextResponse.json({ error: "Missing playlistId" }, { status: 400 });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        songs: {
          include: {
            song: true,
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Transform the response to return songs directly
    const transformedPlaylist = {
      ...playlist,
      songs: playlist.songs.map((ps: PlaylistSong & { song: Song }) => ps.song),
    };

    return NextResponse.json(transformedPlaylist);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
  }
}

// add song to playlist
export async function PUT(request: NextRequest, context: { params: Promise<{ playlistId: string }> }) {
  try {
    const { playlistId } = await context.params;
    const { songId } = await request.json();

    if (!playlistId || !songId) {
      return NextResponse.json({ error: "Missing playlistId or songId" }, { status: 400 });
    }

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const existingEntry = await prisma.playlistSong.findUnique({
      where: { playlistId_songId: { playlistId: playlistId, songId: songId } },
    });

    if (existingEntry) {
      return NextResponse.json({ error: "Song already exists in playlist" }, { status: 400 });
    }

    const newPlaylistSong = await prisma.playlistSong.create({
      data: { playlistId: playlistId, songId: songId },
    });

    return NextResponse.json(newPlaylistSong);
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    return NextResponse.json({ error: "Failed to add song to playlist" }, { status: 500 });
  }
}

// delete song from playlist or entire playlist
export async function DELETE(request: NextRequest, context: { params: Promise<{ playlistId: string }> }) {
  try {
    const { playlistId } = await context.params;
    const body = await request.json();

    // Check if this is a playlist deletion or song removal
    if (body.deleteSongs !== undefined) {
      // This is a playlist deletion
      const { deleteSongs } = body;

      if (deleteSongs) {
        // Delete all songs in the playlist first
        await prisma.playlistSong.deleteMany({
          where: { playlistId },
        });

        // Then delete songs that are not used in other playlists
        const songsToDelete = await prisma.song.findMany({
          where: {
            playlists: {
              none: {}, // Songs not in any playlist
            },
          },
        });

        if (songsToDelete.length > 0) {
          await prisma.song.deleteMany({
            where: {
              id: { in: songsToDelete.map((s) => s.id) },
            },
          });
        }
      } else {
        // Just remove playlist-song associations
        await prisma.playlistSong.deleteMany({
          where: { playlistId },
        });
      }

      // Delete the playlist
      await prisma.playlist.delete({
        where: { id: playlistId },
      });

      return NextResponse.json({ message: "Playlist deleted successfully" });
    } else {
      // This is a song removal from playlist
      const { songId } = body;

      if (!songId) {
        return NextResponse.json({ error: "Missing songId" }, { status: 400 });
      }

      const existingEntry = await prisma.playlistSong.findUnique({
        where: { playlistId_songId: { playlistId: playlistId, songId: songId } },
      });

      if (!existingEntry) {
        return NextResponse.json({ error: "Song not found in playlist" }, { status: 400 });
      }

      await prisma.playlistSong.delete({
        where: { playlistId_songId: { playlistId: playlistId, songId: songId } },
      });

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting from playlist:", error);
    return NextResponse.json({ error: "Failed to delete from playlist" }, { status: 500 });
  }
}
