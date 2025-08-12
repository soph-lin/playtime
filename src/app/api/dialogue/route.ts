import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/dialogue - Get all dialogues
export async function GET() {
  try {
    const dialogues = await prisma.dialogue.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(dialogues);
  } catch (error) {
    console.error("Error fetching dialogues:", error);
    return NextResponse.json({ error: "Failed to fetch dialogues" }, { status: 500 });
  }
}

// POST /api/dialogue - Create a new dialogue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, characterName, description } = body;

    if (!title || !characterName) {
      return NextResponse.json({ error: "Title and character name are required" }, { status: 400 });
    }

    // Create the dialogue
    const dialogue = await prisma.dialogue.create({
      data: {
        title,
        characterName,
        nodes: [
          {
            id: "start",
            type: "DIALOGUE",
            position: { x: 0, y: 0 },
            data: {
              text: "Hello!",
              expression: "neutral",
            },
          },
        ],
        connections: [],
        metadata: {
          description: description || "",
        },
      },
    });

    return NextResponse.json(dialogue, { status: 201 });
  } catch (error) {
    console.error("Error creating dialogue:", error);
    return NextResponse.json({ error: "Failed to create dialogue" }, { status: 500 });
  }
}

// PUT /api/dialogue - Update an existing dialogue
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, characterName, description, nodes, connections } = body;

    if (!id) {
      return NextResponse.json({ error: "Dialogue ID is required" }, { status: 400 });
    }

    // Update the dialogue
    const updatedDialogue = await prisma.dialogue.update({
      where: { id },
      data: {
        title,
        characterName,
        nodes,
        connections,
        metadata: {
          description: description || "",
        },
      },
    });

    return NextResponse.json(updatedDialogue);
  } catch (error) {
    console.error("Error updating dialogue:", error);
    return NextResponse.json({ error: "Failed to update dialogue" }, { status: 500 });
  }
}
