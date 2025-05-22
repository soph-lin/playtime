import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { GAME_CONFIG } from "@/constants/game";

// Convert a number to a base-36 string using uppercase letters and numbers
function numberToCode(num: number, randomOffset: number): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  // Add random offset to make the code more random
  num = num * 1000 + randomOffset;

  // Convert to base-36
  while (num > 0) {
    result = chars[num % 36] + result;
    num = Math.floor(num / 36);
  }

  // Pad with random characters to make it 6 characters
  while (result.length < 6) {
    const randomChar = chars[Math.floor(Math.random() * 36)];
    result = randomChar + result;
  }

  return result;
}

async function generateUniqueCode(retries = 3): Promise<string> {
  // Get the next available ID by counting existing sessions
  const count = await prisma.gameSession.count();
  const nextId = count + 1;

  for (let i = 0; i < retries; i++) {
    // Generate a random offset between 0 and 999
    const randomOffset = Math.floor(Math.random() * 1000);

    // Generate code based on next ID with random offset
    const code = numberToCode(nextId, randomOffset);

    // Check if this code is already in use in any active game
    const existingSession = await prisma.gameSession.findFirst({
      where: {
        code,
        status: {
          in: ["WAITING", "ACTIVE"],
        },
      },
    });

    // If no active game uses this code, return it
    if (!existingSession) {
      return code;
    }
  }

  // If we've exhausted all retries, throw an error
  throw new Error("Failed to generate a unique game code after multiple attempts");
}

// get all game sessions
export async function GET() {
  try {
    const sessions = await prisma.gameSession.findMany({
      include: {
        user: true,
        playlist: true,
        players: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching game sessions:", error);
    return NextResponse.json({ error: "Failed to fetch game sessions" }, { status: 500 });
  }
}

// start new game session
export async function POST(req: NextRequest) {
  try {
    const { playlistId, hostNickname } = await req.json();

    if (!playlistId) {
      return NextResponse.json({ error: "Missing playlistId" }, { status: 400 });
    }

    if (!hostNickname) {
      return NextResponse.json({ error: "Missing hostNickname" }, { status: 400 });
    }

    // Validate host nickname
    if (hostNickname.length < GAME_CONFIG.MIN_NICKNAME_LENGTH) {
      return NextResponse.json(
        { error: `Nickname must be at least ${GAME_CONFIG.MIN_NICKNAME_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (hostNickname.length > GAME_CONFIG.MAX_NICKNAME_LENGTH) {
      return NextResponse.json(
        { error: `Nickname must be at most ${GAME_CONFIG.MAX_NICKNAME_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (!GAME_CONFIG.ALLOWED_NICKNAME_CHARS.test(hostNickname)) {
      return NextResponse.json(
        { error: "Nickname can only contain letters, numbers, spaces, hyphens, and underscores" },
        { status: 400 }
      );
    }

    // Generate a unique code first
    const code = await generateUniqueCode();

    // Create the game session with the code
    const session = await prisma.gameSession.create({
      data: {
        code,
        status: "WAITING",
        playlistId,
        players: {
          create: {
            nickname: hostNickname,
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
        playlist: true,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error creating game session:", error);
    return NextResponse.json({ error: "Failed to create game session" }, { status: 500 });
  }
}
