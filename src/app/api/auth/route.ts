import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateUser } from "@/lib/clerk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user: clerkUser } = body;

    if (!clerkUser) {
      return NextResponse.json({ error: "User data is required" }, { status: 400 });
    }

    const user = await createOrUpdateUser(clerkUser);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        levelExperience: user.levelExperience,
        totalExperience: user.totalExperience,
      },
    });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
