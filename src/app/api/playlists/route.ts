import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// get all playlists
export async function GET() {
  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        songs: {
          include: {
            song: true,
          },
        },
      },
    });

    // Transform the response to return songs directly
    const transformedPlaylists = playlists.map((playlist) => ({
      ...playlist,
      songs: playlist.songs.map((ps) => ps.song),
    }));

    return NextResponse.json(transformedPlaylists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}

// create new playlist
export async function POST(req: NextRequest) {
  try {
    const { name, createdBy, songs } = await req.json();

    console.log("Creating playlist with data:", { name, createdBy, songs });

    if (!name) {
      console.error("Missing required field: name");
      return NextResponse.json(
        {
          error: "Missing playlist name",
          details: {
            name: "missing",
          },
        },
        { status: 400 }
      );
    }

    // If createdBy is provided, verify user exists
    if (createdBy) {
      const user = await prisma.user.findUnique({
        where: { id: createdBy },
      });

      if (!user) {
        console.error("User not found:", createdBy);
        return NextResponse.json(
          {
            error: "User not found",
            details: { userId: createdBy },
          },
          { status: 404 }
        );
      }
    }

    // Create the playlist
    const newPlaylist = await prisma.playlist.create({
      data: {
        name,
        createdBy: createdBy || null,
      },
    });

    // If songs are provided, add them to the playlist
    if (songs && Array.isArray(songs) && songs.length > 0) {
      // Verify all songs exist
      const existingSongs = await prisma.song.findMany({
        where: {
          id: {
            in: songs,
          },
        },
      });

      if (existingSongs.length !== songs.length) {
        return NextResponse.json(
          {
            error: "One or more songs not found",
            details: {
              provided: songs.length,
              found: existingSongs.length,
            },
          },
          { status: 404 }
        );
      }

      // Add songs to playlist
      await prisma.playlistSong.createMany({
        data: songs.map((songId) => ({
          playlistId: newPlaylist.id,
          songId,
        })),
      });
    }

    // Fetch the playlist with songs
    const playlistWithSongs = await prisma.playlist.findUnique({
      where: { id: newPlaylist.id },
      include: {
        songs: {
          include: {
            song: true,
          },
        },
      },
    });

    console.log("Successfully created playlist:", playlistWithSongs);
    return NextResponse.json(playlistWithSongs);
  } catch (error) {
    console.error("Error creating playlist:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      {
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// delete playlist by id
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing playlist id" }, { status: 400 });
    }

    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!existingPlaylist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    await prisma.playlist.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
  }
}
