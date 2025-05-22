import { Song } from "@prisma/client";

export async function getAllSongs(status?: string): Promise<Song[]> {
  try {
    const url = status ? `/api/songs?status=${status}` : "/api/songs";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch songs");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching songs:", error);
    throw error;
  }
}
