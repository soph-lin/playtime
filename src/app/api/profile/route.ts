import { NextResponse } from "next/server";
import { getCurrentUserFromDB } from "@/lib/clerk";

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
