import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getScoringBreakdown } from "@/utils/scoringCalculator";
import { PlayerAttemptsData } from "@/types/scoring";
import type { GameSessionPlayer } from "@prisma/client";
import { broadcastUpdate, type PusherEvent } from "@/lib/pusher";
import { Prisma } from "@prisma/client";

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

    // Get current player data
    const currentPlayer = session.players.find((p) => p.id === playerId);
    if (!currentPlayer) {
      return NextResponse.json({ error: "Player not found in session" }, { status: 404 });
    }

    // Get or create scoring state for the player (using type assertion for new fields)
    const playerData = currentPlayer as GameSessionPlayer & { attempts?: PlayerAttemptsData };
    const attempts: PlayerAttemptsData = playerData.attempts || {};
    let totalPoints = currentPlayer.score || 0;
    let songsCompleted = currentPlayer.correct || 0;
    let totalGuesses = currentPlayer.totalGuesses || 0;

    // Record the attempt
    const currentTime = Date.now();
    const songId = trackId;

    // Check if this is a new song attempt or continuing an existing one
    if (!attempts[songId]) {
      attempts[songId] = {
        songId,
        attempts: 1,
        startTime: currentTime,
        endTime: currentTime,
        isCorrect: correct,
      };
    } else {
      attempts[songId].attempts += 1;
      attempts[songId].endTime = currentTime;
      attempts[songId].isCorrect = correct;
    }

    totalGuesses += 1;

    // Calculate points if correct
    let points = 0;
    let attemptBonus = 0;
    let timeBonus = 0;
    let scoringBreakdown = null;

    if (correct) {
      const timeSeconds = (currentTime - attempts[songId].startTime) / 1000;

      scoringBreakdown = getScoringBreakdown(attempts[songId].attempts, timeSeconds, true);
      points = scoringBreakdown.totalPoints;
      attemptBonus = scoringBreakdown.attemptBonus;
      timeBonus = scoringBreakdown.timeBonus;

      totalPoints += points;
      songsCompleted += 1;
    }

    // Update player's score in database (using type assertion for new fields)
    await prisma.gameSessionPlayer.update({
      where: { id: playerId },
      data: {
        score: totalPoints,
        correct: songsCompleted,
        totalGuesses,
        attempts: attempts as unknown as Prisma.InputJsonValue, // Safe type assertion for JSON field
      },
    });

    // Check if this player has completed all songs
    const totalSongs = session.playlist?.songs.length || 0;
    const playerCompleted = songsCompleted >= totalSongs;

    // Check if any player has completed the game
    const gameCompleted = session.players.some((p: GameSessionPlayer) => (p.correct || 0) >= totalSongs);

    // Determine if this player is first to finish (multiplayer only)
    let firstToFinish: boolean | null = null;
    if (session.players.length > 1 && playerCompleted && gameCompleted) {
      // Check if any other player completed before this one
      const otherPlayersCompleted = session.players.some(
        (p: GameSessionPlayer) => p.id !== playerId && (p.correct || 0) >= totalSongs
      );
      firstToFinish = !otherPlayersCompleted;
    }

    // If game is completed, update session status
    if (gameCompleted) {
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
          players: session.players.map((p: GameSessionPlayer) => ({
            id: p.id,
            nickname: p.nickname,
            score: p.score,
            songsCompleted: p.correct || 0,
          })),
        },
      } as PusherEvent);
    }

    // Broadcast score update
    broadcastUpdate(`session-${session.id}`, {
      type: "scoreUpdate",
      data: {
        playerId,
        score: totalPoints,
        points: points,
        attemptBonus,
        timeBonus,
        totalScore: totalPoints,
        attempts: attempts[songId]?.attempts || 0,
        timeSeconds: correct ? (currentTime - attempts[songId].startTime) / 1000 : 0,
        isCorrect: correct,
        songsCompleted,
        gameCompleted,
        firstToFinish,
        scoringBreakdown,
      },
    } as PusherEvent);

    return NextResponse.json({
      success: true,
      points,
      attemptBonus,
      timeBonus,
      totalScore: totalPoints,
      attempts: attempts[songId]?.attempts || 0,
      timeSeconds: correct ? (currentTime - attempts[songId].startTime) / 1000 : 0,
      isCorrect: correct,
      songsCompleted,
      gameCompleted,
      firstToFinish,
      scoringBreakdown,
    });
  } catch (error) {
    console.error("Error recording guess:", error);
    return NextResponse.json({ error: "Failed to record guess" }, { status: 500 });
  }
}
