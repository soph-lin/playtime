import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// DELETE /api/dialogue/[id] - Delete a dialogue tree
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Dialogue tree ID is required" }, { status: 400 });
    }

    // Delete the dialogue tree
    await prisma.dialogueTree.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Dialogue tree deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting dialogue tree:", error);
    return NextResponse.json({ error: "Failed to delete dialogue tree" }, { status: 500 });
  }
}
