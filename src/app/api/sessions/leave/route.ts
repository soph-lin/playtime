import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { broadcastUpdate, PusherEvent } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, playerId } = await req.json();

    if (!sessionId || !playerId) {
      return NextResponse.json({ error: "Missing sessionId or playerId" }, { status: 400 });
    }

    // Get the current session and its players
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        players: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Game session not found" }, { status: 404 });
    }

    // Get the leaving player's nickname
    const leavingPlayer = session.players.find((p) => p.id === playerId);
    if (!leavingPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Remove the player from the session
    await prisma.gameSessionPlayer.delete({
      where: { id: playerId },
    });

    // Get updated player count
    const remainingPlayers = await prisma.gameSessionPlayer.count({
      where: { sessionId },
    });

    // If no players left, delete the session
    if (remainingPlayers === 0) {
      await prisma.gameSession.delete({
        where: { id: sessionId },
      });
      return NextResponse.json({ message: "Session deleted as no players remain" });
    }

    // If the leaving player was the host, transfer host status to the next player
    if (session.userId === playerId) {
      const nextPlayer = await prisma.gameSessionPlayer.findFirst({
        where: { sessionId },
        orderBy: { id: "asc" },
      });

      if (nextPlayer) {
        await prisma.gameSession.update({
          where: { id: sessionId },
          data: {
            userId: nextPlayer.id,
          },
        });

        // Broadcast host change
        broadcastUpdate(`session-${sessionId}`, {
          type: "hostChanged",
          data: {
            playerId: nextPlayer.id,
            nickname: nextPlayer.nickname,
          },
        } as PusherEvent);
      }
    }

    // Broadcast player left
    broadcastUpdate(`session-${sessionId}`, {
      type: "playerLeft",
      data: {
        playerId,
        nickname: leavingPlayer.nickname,
      },
    } as PusherEvent);

    return NextResponse.json({ message: "Player left successfully" });
  } catch (error) {
    console.error("Error leaving game:", error);
    return NextResponse.json({ error: "Failed to leave game" }, { status: 500 });
  }
}
