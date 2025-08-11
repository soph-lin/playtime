import { NextResponse } from "next/server";
import { getCurrentUserFromDB } from "@/lib/clerk";
import db from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUserFromDB();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUserFromDB();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (username.trim().length > 20) {
      return NextResponse.json({ error: "Username must be 20 characters or less" }, { status: 400 });
    }

    // Check if username is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    // Update the username
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { username: username.trim() },
      include: {
        achievements: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
