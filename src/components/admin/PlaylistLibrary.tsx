"use client";

import { useState, useEffect } from "react";
import { Playlist, Song } from "@prisma/client";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import SongLibraryItem from "./SongLibraryItem";

interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

interface PlaylistLibraryProps {
  searchQuery?: string;
}

export default function PlaylistLibrary({ searchQuery = "" }: PlaylistLibraryProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set());
  const [playlistSongs, setPlaylistSongs] = useState<Record<string, Song[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists");
      if (!response.ok) throw new Error("Failed to fetch playlists");
      const data = await response.json();
      setPlaylists(data);

      // Fetch songs for all playlists
      const songsPromises = data.map((playlist: Playlist) =>
        fetch(`/api/playlists/${playlist.id}`)
          .then((res) => res.json())
          .then((playlistData: PlaylistWithSongs) => ({
            id: playlist.id,
            songs: playlistData.songs,
          }))
      );

      const songsResults = await Promise.all(songsPromises);
      const songsMap = songsResults.reduce(
        (acc, { id, songs }) => ({
          ...acc,
          [id]: songs,
        }),
        {}
      );

      setPlaylistSongs(songsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch playlists");
    } finally {
      setLoading(false);
    }
  };

  const togglePlaylist = (playlistId: string) => {
    setExpandedPlaylists((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-center">Loading playlists...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (playlists.length === 0) return <div className="text-center">No playlists found</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Playlist Library</h2>
      {filteredPlaylists.map((playlist) => (
        <div key={playlist.id} className="border rounded-lg overflow-hidden">
          <div
            className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
            onClick={() => togglePlaylist(playlist.id)}
          >
            <div className="flex items-center space-x-2">
              {expandedPlaylists.has(playlist.id) ? (
                <CaretDown size={20} weight="bold" />
              ) : (
                <CaretRight size={20} weight="bold" />
              )}
              <span className="font-medium">{playlist.name}</span>
            </div>
            <span className="text-sm text-gray-500">{playlistSongs[playlist.id]?.length || 0} songs</span>
          </div>
          <div
            className={`transition-all duration-300 ease-in-out ${
              expandedPlaylists.has(playlist.id) ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {playlistSongs[playlist.id]?.length === 0 ? (
                <div className="text-gray-500 text-center">No songs in this playlist</div>
              ) : (
                playlistSongs[playlist.id]?.map((song) => (
                  <SongLibraryItem key={song.id} song={song} editable={false} refreshSongs={() => {}} />
                ))
              )}
            </div>
          </div>
        </div>
      ))}
      {filteredPlaylists.length === 0 && (
        <div className="text-center text-gray-500">No playlists match your search</div>
      )}
    </div>
  );
}
