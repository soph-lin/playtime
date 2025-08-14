import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateCompletionBonuses } from "@/lib/scoringCalculator";
import { broadcastUpdate, type PusherEvent } from "@/lib/pusher";
import { SongAttemptData } from "@/types/scoring";

export async function POST(req: NextRequest) {
  try {
    const { playerId, sessionCode } = await req.json();

    if (!playerId || !sessionCode) {
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

    // Get current player data
    const currentPlayer = session.players.find((p) => p.id === playerId);
    if (!currentPlayer) {
      return NextResponse.json({ error: "Player not found in session" }, { status: 404 });
    }

    const totalSongs = session.playlist?.songs.length || 0;
    const songsCompleted = currentPlayer.correct || 0;

    // Check if player has actually completed all songs
    if (songsCompleted < totalSongs) {
      return NextResponse.json({ error: "Player has not completed all songs" }, { status: 400 });
    }

    // Calculate completion time if not already set
    let completionTime = currentPlayer.completionTime;
    if (!completionTime && currentPlayer.attempts) {
      try {
        const attempts = currentPlayer.attempts as unknown as Record<string, SongAttemptData>;
        const attemptValues = Object.values(attempts);
        if (attemptValues.length > 0) {
          const firstSongStart = Math.min(...attemptValues.map((a) => a.startTime));
          const lastSongEnd = Math.max(...attemptValues.map((a) => a.endTime));
          completionTime = Math.round((lastSongEnd - firstSongStart) / 1000); // Convert to seconds
        }
      } catch (error) {
        console.warn("Failed to parse attempts data for completion time calculation:", error);
      }
    }

    // Determine if this player is first to finish (multiplayer only)
    let firstToFinish: boolean | null = null;
    if (session.players.length > 1) {
      // Check if any other player completed before this one
      const otherPlayersCompleted = session.players.some((p) => p.id !== playerId && (p.correct || 0) >= totalSongs);
      firstToFinish = !otherPlayersCompleted;
    }

    // Calculate completion bonuses
    const completionBonuses = calculateCompletionBonuses(
      songsCompleted,
      totalSongs,
      completionTime || 0,
      firstToFinish
    );

    // Update player with completion data
    await prisma.gameSessionPlayer.update({
      where: { id: playerId },
      data: {
        completionTime,
        firstToFinish,
      },
    });

    // Check if all players have completed the game
    const allPlayersCompleted = session.players.every((p) => (p.correct || 0) >= totalSongs);

    if (allPlayersCompleted) {
      // Update session status to completed
      await prisma.gameSession.update({
        where: { code: sessionCode },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
        },
      });

      // Broadcast game completion
      broadcastUpdate(`session-${session.id}`, {
        type: "gameCompleted",
        data: {
          players: session.players.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            score: p.score,
            songsCompleted: p.correct || 0,
            completionTime: p.completionTime,
            firstToFinish: p.firstToFinish,
          })),
        },
      } as PusherEvent);
    }

    // Broadcast completion update
    broadcastUpdate(`session-${session.id}`, {
      type: "playerCompleted",
      data: {
        playerId,
        songsCompleted,
        completionTime,
        firstToFinish,
        completionBonuses,
      },
    } as PusherEvent);

    return NextResponse.json({
      success: true,
      songsCompleted,
      completionTime,
      firstToFinish,
      completionBonuses,
      gameCompleted: allPlayersCompleted,
    });
  } catch (error) {
    console.error("Error processing completion:", error);
    return NextResponse.json({ error: "Failed to process completion" }, { status: 500 });
  }
}
