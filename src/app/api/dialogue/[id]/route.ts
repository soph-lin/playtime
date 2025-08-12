import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// DELETE /api/dialogue/[id] - Delete a dialogue tree
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Dialogue ID is required" }, { status: 400 });
    }

    // Delete the dialogue
    await prisma.dialogue.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Dialogue deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting dialogue:", error);
    return NextResponse.json({ error: "Failed to delete dialogue" }, { status: 500 });
  }
}
