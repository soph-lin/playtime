"use client";

import { useState, useEffect } from "react";
import SongLibraryItem from "./SongLibraryItem";
import { Song } from "@prisma/client";
import LoadingSpinner from "../effects/LoadingSpinner";
import { getAllSongs } from "@/services/songService";

export default function SongLibrary() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const data = await getAllSongs("approved");
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch songs");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedSongs = songs
    .filter((song) => song.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-end mb-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-4">
        {filteredAndSortedSongs.length === 0 ? (
          <div className="text-center text-gray-500">No songs found</div>
        ) : (
          filteredAndSortedSongs.map((song) => <SongLibraryItem key={song.id} song={song} refreshSongs={fetchSongs} />)
        )}
      </div>
    </div>
  );
}
