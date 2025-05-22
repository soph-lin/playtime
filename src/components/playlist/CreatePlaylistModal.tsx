"use client";

import { useState, useEffect } from "react";
import { Song } from "@prisma/client";
import Modal from "../ui/Modal";
import GameSongItem from "../game/GameSongItem";
import { toast } from "react-hot-toast";
import SongLibraryItem from "../admin/SongLibraryItem";

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: () => void;
}

type TabType = "general" | "addSongs" | "viewPlaylist";

export default function CreatePlaylistModal({ isOpen, onClose, onPlaylistCreated }: CreatePlaylistModalProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playlistName, setPlaylistName] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isCreating, setIsCreating] = useState(false);

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/songs?status=approved");
      if (!response.ok) throw new Error("Failed to fetch songs");
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch songs when modal opens and when switching to addSongs tab
  useEffect(() => {
    if (isOpen) {
      fetchSongs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === "addSongs") {
      fetchSongs();
    }
  }, [activeTab]);

  const filteredSongs = songs
    .filter((song) => song.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  const handleSongSelect = (song: Song) => {
    if (!selectedSongs.some((s) => s.id === song.id)) {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const handleSongRemove = (songId: string) => {
    setSelectedSongs(selectedSongs.filter((song) => song.id !== songId));
  };

  const handleCreatePlaylist = async () => {
    if (isCreating) return;

    if (!playlistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    if (selectedSongs.length < 5) {
      toast.error("Playlist needs at least 5 songs");
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          songs: selectedSongs.map((song) => song.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create playlist");
      }

      toast.success("Playlist created successfully!");
      onPlaylistCreated?.();
      onClose();
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal title="Create New Playlist" isOpen={isOpen} onClose={onClose} className="h-[85vh] w-[90vw] max-w-[600px]">
      <div className="flex flex-col h-full">
        <div className="flex-none mb-4">
          <div className="flex justify-center space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 text-sm font-medium relative ${
                activeTab === "general"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 after:ease-in-out after:scale-x-100"
                  : "text-gray-500 hover:text-gray-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 after:ease-in-out after:scale-x-0"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("addSongs")}
              className={`px-4 py-2 text-sm font-medium relative ${
                activeTab === "addSongs"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 after:ease-in-out after:scale-x-100"
                  : "text-gray-500 hover:text-gray-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 after:ease-in-out after:scale-x-0"
              }`}
            >
              Add Songs
            </button>
            <button
              onClick={() => setActiveTab("viewPlaylist")}
              className={`px-4 py-2 text-sm font-medium relative ${
                activeTab === "viewPlaylist"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 after:ease-in-out after:scale-x-100"
                  : "text-gray-500 hover:text-gray-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 after:ease-in-out after:scale-x-0"
              }`}
            >
              View Playlist ({selectedSongs.length})
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "general" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="playlistName" className="block text-sm font-medium text-gray-700">
                  Playlist Name
                </label>
                <input
                  type="text"
                  id="playlistName"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter playlist name"
                />
              </div>
            </div>
          )}

          {activeTab === "addSongs" && (
            <div className="flex flex-col h-full">
              <div className="flex-none">
                <input
                  type="text"
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg outline-blue-500"
                />
              </div>

              <div className="flex-1 min-h-0 overflow-hidden mt-2">
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  {isLoading ? (
                    <div className="text-center">Loading songs...</div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSongs.map((song) => (
                        <GameSongItem
                          key={song.id}
                          song={song}
                          onAdd={() => handleSongSelect(song)}
                          onRemove={() => handleSongRemove(song.id)}
                          isSelected={selectedSongs.some((s) => s.id === song.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "viewPlaylist" && (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
              {selectedSongs.length === 0 ? (
                <div className="text-center text-gray-500">No songs added to playlist yet</div>
              ) : (
                <div className="space-y-2">
                  {selectedSongs.map((song) => (
                    <SongLibraryItem key={song.id} song={song} editable={false} refreshSongs={() => {}} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-none pt-4 mt-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCreatePlaylist}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Playlist"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
