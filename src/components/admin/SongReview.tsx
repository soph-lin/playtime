"use client";

import { useState, useEffect } from "react";
import SongLibraryItem from "./SongLibraryItem";
import { Song } from "@prisma/client";
import LoadingSpinner from "../effects/LoadingSpinner";
import { getAllSongs } from "@/services/songService";

export default function SongReview() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const data = await getAllSongs("pending");
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch songs");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-4">
        {songs.length === 0 ? (
          <div className="text-center text-gray-500">Wow, such empty</div>
        ) : (
          songs.map((song) => <SongLibraryItem key={song.id} song={song} editable={true} refreshSongs={fetchSongs} />)
        )}
      </div>
    </div>
  );
}
