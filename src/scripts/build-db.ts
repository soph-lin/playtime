import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { SoundCloudTrack } from "@/app/api/soundcloud/types";
import { SoundCloudSearchService } from "@/services/upload/soundcloud";

dotenv.config({ path: ".env.local" });

async function searchTracks(query: string): Promise<SoundCloudTrack[]> {
  const searchService = new SoundCloudSearchService();
  const tracks = await searchService.searchTracks(query, 50);

  // Convert TrackData to SoundCloudTrack format
  return tracks.map((track) => ({
    id: track.soundcloudId || "",
    title: track.title,
    permalinkUrl: track.permalinkUrl || "",
    duration: track.duration || 0,
  }));
}

async function main() {
  try {
    const searchQueries = ["Taylor Swift", "Ed Sheeran", "Drake", "Billie Eilish", "The Weeknd"];

    const allTracks: SoundCloudTrack[] = [];

    // Make sure the development server is running
    console.log("Make sure your Next.js development server is running on http://localhost:3000");

    for (const query of searchQueries) {
      console.log(`Searching for: ${query}`);
      const tracks = (await searchTracks(query)) as SoundCloudTrack[];
      allTracks.push(...tracks);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // const formattedTracks = allTracks
    //   .filter(track => track.title && track.permalinkUrl)
    //   .map(track => ({
    //     id: track.id,
    //     title: track.title,
    //     permalinkUrl: track.permalinkUrl,
    //   }));

    const uniqueTracks = Array.from(new Map(allTracks.map((track) => [track.id, track])).values());

    const fileContent = `import { SoundCloudTrack } from '@/app/api/soundcloud/types';
export const trackDatabase: SoundCloudTrack[] = ${JSON.stringify(uniqueTracks, null, 2)};
`;

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dbPath = path.join(__dirname, "..", "lib", "soundcloud", "trackDatabase.ts");

    await fs.writeFile(dbPath, fileContent);
    console.log(`Successfully saved ${uniqueTracks.length} tracks to the database!`);
  } catch (error) {
    console.error("Error building track database:", error);
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      console.error("\nMake sure your Next.js development server is running!");
      console.error("Run `npm run dev` in another terminal window first.");
    }
    process.exit(1);
  }
}

main();
