import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

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
      songs: playlist.songs.map((ps) => ps.song),
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

// delete song from playlist
export async function DELETE(request: NextRequest, context: { params: Promise<{ playlistId: string }> }) {
  try {
    const { playlistId } = await context.params;
    const { songId } = await request.json();

    if (!playlistId || !songId) {
      return NextResponse.json({ error: "Missing playlistId or songId" }, { status: 400 });
    }

    const existingEntry = await prisma.playlistSong.findUnique({
      where: { playlistId_songId: { playlistId: playlistId, songId: songId } },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Song not found in playlist" }, { status: 404 });
    }

    await prisma.playlistSong.delete({
      where: { playlistId_songId: { playlistId: playlistId, songId: songId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting song from playlist:", error);
    return NextResponse.json({ error: "Failed to delete song from playlist" }, { status: 500 });
  }
}
