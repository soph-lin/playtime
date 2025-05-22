import { NextResponse } from "next/server";
import { SOUNDCLOUD_API_URL } from "@/config/constants";
import { SoundCloudTrack } from "../types";
import { SoundCloudTokenService } from "@/services/soundcloud/token";

const tokenService = SoundCloudTokenService.getInstance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const offset = parseInt(searchParams.get("offset") || "0");
  const requestedLimit = parseInt(searchParams.get("limit") || "3");

  // Adjust the limit to account for SoundCloud API's behavior of returning limit-1 tracks
  const adjustedLimit = requestedLimit + 1;

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    // Get access token from our token service
    console.log("Getting access token...");
    const accessToken = await tokenService.getAccessToken();
    console.log("Access token received:", accessToken ? "Token received" : "No token");

    const searchUrl = `${SOUNDCLOUD_API_URL}/tracks?q=${encodeURIComponent(query)}&limit=${adjustedLimit}&offset=${offset}&access=playable,preview,blocked`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    console.log("Search response status:", searchResponse.status);
    console.log("Search response headers:", JSON.stringify(Object.fromEntries([...searchResponse.headers.entries()])));

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("SoundCloud API error:", {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText,
      });

      return NextResponse.json(
        { error: `SoundCloud API error: ${searchResponse.status} - ${errorText}` },
        { status: searchResponse.status }
      );
    }

    const tracks = await searchResponse.json();
    console.log("Got search results, count:", tracks.length || 0);
    console.log("Raw tracks data:", JSON.stringify(tracks.slice(0, 3)));
    // Log the total number of tracks and the requested limit
    console.log(`SoundCloud API returned ${tracks.length} tracks (requested limit: ${requestedLimit})`);
    // If we got fewer tracks than requested, log a warning
    if (tracks.length < requestedLimit) {
      console.warn(`SoundCloud API returned fewer tracks (${tracks.length}) than requested (${requestedLimit})`);
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    const formattedTracks = tracks.map((track: SoundCloudTrack) => ({
      id: track.id,
      title: track.title,
      permalinkUrl: track.permalinkUrl,
      duration: track.duration,
    }));
    console.log("Formatted tracks count:", formattedTracks.length);
    console.log("Formatted tracks:", JSON.stringify(formattedTracks.slice(0, 3)));

    return NextResponse.json({ tracks: formattedTracks });
  } catch (error) {
    console.error("Error in SoundCloud search:", error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search SoundCloud" },
      { status: 500 }
    );
  }
}
