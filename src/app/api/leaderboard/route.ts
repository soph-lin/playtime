import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get all players with their game statistics
    const topPlayers = await prisma.gameSessionPlayer.findMany({
      orderBy: [
        { score: "desc" }, // Primary sort by score
        { totalGuesses: "asc" }, // Secondary sort by efficiency (fewer guesses)
      ],
      take: 10,
      select: {
        nickname: true,
        score: true,
        totalGuesses: true,
        gameSession: {
          select: {
            startedAt: true,
            playlist: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    console.log("Found players:", topPlayers);

    // Transform the data to include calculated statistics
    const formattedPlayers = topPlayers.map((player) => ({
      nickname: player.nickname,
      score: player.score,
      totalGuesses: player.totalGuesses,
      accuracy: player.totalGuesses > 0 ? ((player.score / player.totalGuesses) * 100).toFixed(1) : "0.0",
      lastPlayed: player.gameSession?.startedAt || new Date(),
      playlist: player.gameSession?.playlist?.name || "Unknown Playlist",
    }));

    console.log("Formatted players:", formattedPlayers);

    return NextResponse.json(formattedPlayers);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
