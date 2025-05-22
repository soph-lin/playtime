import fs from "fs/promises";
import path from "path";
import { soundCloudClient } from "../lib/soundcloud/client";
import { SoundCloudTrack } from "@/app/api/soundcloud/types";

async function searchTracks(query: string): Promise<SoundCloudTrack[]> {
  const searchResponse = await soundCloudClient.search(query);
  return searchResponse.collection;
}

async function main() {
  try {
    // List of popular songs/artists to search for
    const searchQueries = [
      "Taylor Swift",
      "Ed Sheeran",
      "Billie Eilish",
      "The Weeknd",
      // Add more queries as needed
    ];

    // const accessToken = await getAccessToken();
    const allTracks: SoundCloudTrack[] = [];

    for (const query of searchQueries) {
      console.log(`Searching for: ${query}`);
      const tracks = await searchTracks(query);
      allTracks.push(...tracks);

      // Wait a bit between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Filter and format tracks
    const formattedTracks = allTracks
      .filter((track) => track.title && track.permalinkUrl) // Remove any invalid tracks
      .map((track) => ({
        id: track.id,
        title: track.title,
        permalinkUrl: track.permalinkUrl,
      }));

    // Remove duplicates
    const uniqueTracks = Array.from(new Map(formattedTracks.map((track) => [track.id, track])).values());

    // Generate the TypeScript file content
    const fileContent = `
export interface TrackOption {
  id: number;
  title: string;
  permalinkUrl: string;
}

export const trackDatabase: TrackOption[] = ${JSON.stringify(uniqueTracks, null, 2)};
`;

    // Write to the database file
    await fs.writeFile(path.join(process.cwd(), "src/lib/soundcloud/trackDatabase.ts"), fileContent);

    console.log(`Successfully saved ${uniqueTracks.length} tracks to the database!`);
  } catch (error) {
    console.error("Error building track database:", error);
    process.exit(1);
  }
}

main();
