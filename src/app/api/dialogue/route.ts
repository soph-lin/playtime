import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/dialogue - Get all dialogue trees
export async function GET() {
  try {
    const dialogueTrees = await prisma.dialogueTree.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(dialogueTrees);
  } catch (error) {
    console.error("Error fetching dialogue trees:", error);
    return NextResponse.json({ error: "Failed to fetch dialogue trees" }, { status: 500 });
  }
}

// POST /api/dialogue - Create a new dialogue tree
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, characterName, description } = body;

    if (!title || !characterName) {
      return NextResponse.json({ error: "Title and character name are required" }, { status: 400 });
    }

    // Create the dialogue tree
    const dialogueTree = await prisma.dialogueTree.create({
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

    return NextResponse.json(dialogueTree, { status: 201 });
  } catch (error) {
    console.error("Error creating dialogue tree:", error);
    return NextResponse.json({ error: "Failed to create dialogue tree" }, { status: 500 });
  }
}

// PUT /api/dialogue - Update an existing dialogue tree
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, characterName, description, nodes, connections } = body;

    if (!id) {
      return NextResponse.json({ error: "Dialogue tree ID is required" }, { status: 400 });
    }

    // Update the dialogue tree
    const updatedTree = await prisma.dialogueTree.update({
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

    return NextResponse.json(updatedTree);
  } catch (error) {
    console.error("Error updating dialogue tree:", error);
    return NextResponse.json({ error: "Failed to update dialogue tree" }, { status: 500 });
  }
}
