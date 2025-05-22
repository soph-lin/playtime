import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;

    const gameSession = await prisma.gameSession.findUnique({
      where: { code },
      include: {
        user: true,
        playlist: {
          include: {
            songs: {
              include: {
                song: true,
              },
            },
          },
        },
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!gameSession) {
      return NextResponse.json({ error: "Game session not found" }, { status: 404 });
    }

    // Transform the playlist to include songs directly
    const transformedSession = {
      ...gameSession,
      playlist: gameSession.playlist
        ? {
            ...gameSession.playlist,
            songs: gameSession.playlist.songs.map((ps) => ps.song),
          }
        : null,
    };

    return NextResponse.json(transformedSession);
  } catch (error) {
    console.error("Error fetching game session:", error);
    return NextResponse.json({ error: "Failed to fetch game session" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { status } = await request.json();
    const { code } = await params;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const gameSession = await prisma.gameSession.update({
      where: { code },
      data: { status },
      include: {
        user: true,
        playlist: {
          include: {
            songs: {
              include: {
                song: true,
              },
            },
          },
        },
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    // Transform the playlist to include songs directly
    const transformedSession = {
      ...gameSession,
      playlist: gameSession.playlist
        ? {
            ...gameSession.playlist,
            songs: gameSession.playlist.songs.map((ps) => ps.song),
          }
        : null,
    };

    return NextResponse.json(transformedSession);
  } catch (error) {
    console.error("Error updating game session:", error);
    return NextResponse.json({ error: "Failed to update game session" }, { status: 500 });
  }
}
