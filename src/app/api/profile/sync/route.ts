import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/lib/clerk";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in our database
    const user = await ensureUserExists(userId);

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        totalExperience: user.totalExperience,
        tutorialComplete: user.tutorialComplete,
      },
    });
  } catch (error) {
    console.error("Error in profile sync:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
