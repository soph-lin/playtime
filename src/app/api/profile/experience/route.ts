import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addExperience } from "@/lib/clerk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { points } = body;

    if (typeof points !== "number" || points <= 0) {
      return NextResponse.json({ error: "Valid points value is required" }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await addExperience(userId, points);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        level: user.level,
        levelExperience: user.levelExperience,
        totalExperience: user.totalExperience,
      },
    });
  } catch (error) {
    console.error("Error adding experience:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
