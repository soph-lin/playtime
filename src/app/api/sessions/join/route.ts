import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { GAME_CONFIG } from "@/constants/game";
import { broadcastUpdate, PusherEvent } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { code, userId, nickname } = await req.json();

    console.log("Joining game with data:", { code, userId, nickname });

    if (!code) {
      console.error("Missing game code");
      return NextResponse.json({ error: "Missing game code" }, { status: 400 });
    }

    if (!nickname) {
      console.error("Missing nickname");
      return NextResponse.json({ error: "Missing nickname" }, { status: 400 });
    }

    // Validate nickname
    if (nickname.length < GAME_CONFIG.MIN_NICKNAME_LENGTH) {
      console.error(`Nickname too short: ${nickname.length} < ${GAME_CONFIG.MIN_NICKNAME_LENGTH}`);
      return NextResponse.json(
        { error: `Nickname must be at least ${GAME_CONFIG.MIN_NICKNAME_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (nickname.length > GAME_CONFIG.MAX_NICKNAME_LENGTH) {
      console.error(`Nickname too long: ${nickname.length} > ${GAME_CONFIG.MAX_NICKNAME_LENGTH}`);
      return NextResponse.json(
        { error: `Nickname must be at most ${GAME_CONFIG.MAX_NICKNAME_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (!GAME_CONFIG.ALLOWED_NICKNAME_CHARS.test(nickname)) {
      console.error(`Invalid nickname characters: ${nickname}`);
      return NextResponse.json(
        { error: "Nickname can only contain letters, numbers, spaces, hyphens, and underscores" },
        { status: 400 }
      );
    }

    // Find the game session
    console.log("Looking for game session with code:", code);
    const gameSession = await prisma.gameSession.findUnique({
      where: { code },
      include: {
        players: true,
      },
    });

    if (!gameSession) {
      console.error("Game session not found for code:", code);
      return NextResponse.json({ error: "Game session not found" }, { status: 404 });
    }

    console.log("Found game session:", {
      id: gameSession.id,
      status: gameSession.status,
      playerCount: gameSession.players.length,
    });

    if (gameSession.status !== "WAITING") {
      console.error("Game session not in waiting state:", gameSession.status);
      return NextResponse.json({ error: "Game session is not accepting new players" }, { status: 400 });
    }

    // Check player count
    if (gameSession.players.length >= GAME_CONFIG.MAX_PLAYERS) {
      console.error(`Game session full: ${gameSession.players.length} >= ${GAME_CONFIG.MAX_PLAYERS}`);
      return NextResponse.json(
        { error: `Game session is full (max ${GAME_CONFIG.MAX_PLAYERS} players)` },
        { status: 400 }
      );
    }

    // Check for existing nickname
    const existingPlayer = gameSession.players.find(
      (player) => player.nickname.toLowerCase() === nickname.toLowerCase()
    );

    if (existingPlayer) {
      console.error("Nickname already taken:", nickname);
      return NextResponse.json({ error: "Nickname is already taken" }, { status: 400 });
    }

    // Add player to the session
    console.log("Adding player to session:", { nickname, userId });
    const updatedSession = await prisma.gameSession.update({
      where: { id: gameSession.id },
      data: {
        players: {
          create: {
            userId: null,
            nickname,
            score: 0,
            correct: 0,
            totalGuesses: 0,
          },
        },
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    // Get the newly created player
    const newPlayer = updatedSession.players.find((p) => p.nickname === nickname);
    if (!newPlayer) {
      console.error("Failed to find newly created player");
      return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
    }

    // Broadcast player joined event
    broadcastUpdate(`session-${gameSession.id}`, {
      type: "playerJoined",
      data: {
        playerId: newPlayer.id,
        nickname: newPlayer.nickname,
      },
    } as PusherEvent);

    console.log("Successfully added player to session");
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error joining game session:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json({ error: "Failed to join game session" }, { status: 500 });
  }
}
