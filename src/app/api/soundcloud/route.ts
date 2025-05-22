import { NextResponse } from "next/server";
import { soundCloudClient } from "@/lib/soundcloud/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const trackId = searchParams.get("trackId");
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = parseInt(searchParams.get("limit") || "3");

    if (!query && !trackId) {
      return NextResponse.json({ error: "Missing query or trackId parameter" }, { status: 400 });
    }

    if (trackId) {
      const track = await soundCloudClient.getTrack(trackId);
      return NextResponse.json(track);
    }

    const searchResults = await soundCloudClient.search(query!, limit, offset);
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("SoundCloud API error:", error);
    return NextResponse.json({ error: "Failed to fetch from SoundCloud API" }, { status: 500 });
  }
}
