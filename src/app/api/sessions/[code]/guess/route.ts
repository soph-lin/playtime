import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { broadcastUpdate, PusherEvent } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { playerId, trackId, correct, sessionCode } = await req.json();

    if (!playerId || !trackId || correct === undefined || !sessionCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the current session
    const session = await prisma.gameSession.findUnique({
      where: { code: sessionCode },
      include: {
        players: true,
        playlist: {
          include: {
            songs: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Game session not found" }, { status: 404 });
    }

    // Update player's score
    const updatedSession = await prisma.gameSession.update({
      where: { code: sessionCode },
      data: {
        players: {
          update: {
            where: { id: playerId },
            data: {
              score: { increment: correct ? 1 : 0 },
              totalGuesses: { increment: 1 },
            },
          },
        },
      },
      include: {
        players: true,
      },
    });

    // Check if all songs have been played
    const totalSongs = session.playlist?.songs.length || 0;
    const totalGuesses = session.players.reduce((sum, player) => sum + player.totalGuesses, 0);

    // If all songs have been played, mark the game as completed
    if (totalGuesses >= totalSongs) {
      await prisma.gameSession.update({
        where: { code: sessionCode },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
        },
      });

      // Broadcast game completion
      broadcastUpdate(`session-${session.id}`, {
        type: "roundUpdate",
        data: {
          players: updatedSession.players.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            score: p.score,
          })),
        },
      } as PusherEvent);
    }

    // Broadcast score update
    broadcastUpdate(`session-${session.id}`, {
      type: "scoreUpdate",
      data: {
        playerId,
        score: updatedSession.players.find((p) => p.id === playerId)?.score || 0,
      },
    } as PusherEvent);

    return NextResponse.json({ message: "Guess recorded successfully" });
  } catch (error) {
    console.error("Error recording guess:", error);
    return NextResponse.json({ error: "Failed to record guess" }, { status: 500 });
  }
}
