"use client";

import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { toast } from "react-hot-toast";
import useGameStore from "@/stores/gameStore";
import { GAME_CONFIG } from "@/constants/game";
import { Playlist, Song } from "@prisma/client";
import Dropdown from "../ui/Dropdown";
import Input from "../ui/Input";

interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameCreated?: (sessionCode: string) => void;
}

export default function CreateGameModal({ isOpen, onClose, onGameCreated }: CreateGameModalProps) {
  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [hostNickname, setHostNickname] = useState("");
  const [songCount, setSongCount] = useState<number>(10);
  const [songCountText, setSongCountText] = useState<string>("10");
  const [isCreating, setIsCreating] = useState(false);
  const createGame = useGameStore((state) => state.createGame);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists");
      if (!response.ok) throw new Error("Failed to fetch playlists");
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error("Failed to load playlists");
    }
  };

  const handlePlaylistSelect = (playlistName: string) => {
    const selectedPlaylist = playlists.find((p) => p.name === playlistName);
    if (selectedPlaylist) {
      setSelectedPlaylistId(selectedPlaylist.id);
      // Reset song count to minimum when playlist changes
      setSongCount(10);
      setSongCountText("10");
    }
  };

  const handleCreateGame = async () => {
    if (!hostNickname) {
      toast.error("Please enter your nickname");
      return;
    }

    if (!selectedPlaylistId) {
      toast.error("Please select a playlist");
      return;
    }

    if (hostNickname.length < GAME_CONFIG.MIN_NICKNAME_LENGTH) {
      toast.error(`Nickname must be at least ${GAME_CONFIG.MIN_NICKNAME_LENGTH} characters`);
      return;
    }

    if (hostNickname.length > GAME_CONFIG.MAX_NICKNAME_LENGTH) {
      toast.error(`Nickname must be at most ${GAME_CONFIG.MAX_NICKNAME_LENGTH} characters`);
      return;
    }

    if (!GAME_CONFIG.ALLOWED_NICKNAME_CHARS.test(hostNickname)) {
      toast.error("Nickname can only contain letters, numbers, spaces, hyphens, and underscores");
      return;
    }

    // Validate song count
    if (songCount < 10 || songCount > maxSongCount) {
      toast.error(`Please choose a number between 10 and ${maxSongCount}!`);
      return;
    }

    try {
      setIsCreating(true);
      const session = await createGame(selectedPlaylistId, hostNickname, songCount);
      if (session) {
        // Copy game code to clipboard
        navigator.clipboard.writeText(session.code);
        toast.success("Copied game code!");

        // Call the callback if provided
        if (onGameCreated) {
          onGameCreated(session.code);
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const availableSongs = selectedPlaylist?.songs?.length || 0;
  const maxSongCount = availableSongs; // No arbitrary cap - use full playlist

  return (
    <Modal
      title="Create New Game"
      isOpen={isOpen}
      onClose={onClose}
      className="w-[90vw] max-w-[500px] overflow-visible"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="hostNickname" className="block text-sm font-medium text-gray-700">
            Your Nickname
          </label>
          <Input
            id="hostNickname"
            type="text"
            value={hostNickname}
            onChange={(e) => setHostNickname(e.target.value)}
            placeholder="Enter your nickname"
            maxLength={GAME_CONFIG.MAX_NICKNAME_LENGTH}
          />
          <p className="text-xs text-gray-500">
            {GAME_CONFIG.MIN_NICKNAME_LENGTH}-{GAME_CONFIG.MAX_NICKNAME_LENGTH} characters, letters, numbers, spaces,
            hyphens, and underscores only
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Playlist</label>
          <Dropdown
            options={playlists.map((playlist) => playlist.name)}
            onSelect={handlePlaylistSelect}
            placeholder="Choose a playlist"
            value={selectedPlaylist?.name || null}
            className="text-sm"
          />
          {selectedPlaylist && (
            <p className="text-xs text-gray-500">{availableSongs} songs available in this playlist</p>
          )}
        </div>

        {selectedPlaylist && (
          <div className="space-y-2">
            <label htmlFor="songCount" className="block text-sm font-medium text-gray-700">
              Number of Songs
            </label>
            <div className="flex items-center space-x-3">
              <Input
                id="songCount"
                value={songCountText}
                onChange={(e) => {
                  const value = e.target.value;
                  setSongCountText(value);
                  if (value === "") {
                    setSongCount(0);
                  } else {
                    const count = parseInt(value);
                    if (!isNaN(count)) {
                      setSongCount(count);
                    }
                  }
                }}
                placeholder={`Choose 10-${maxSongCount} songs`}
                className="flex-1"
              />
              <span className="text-xs text-gray-500">songs</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreateGame}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create Game"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
