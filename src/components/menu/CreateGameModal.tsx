"use client";

import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { toast } from "react-hot-toast";
import useGameStore from "@/stores/gameStore";
import { GAME_CONFIG } from "@/constants/game";
import { Playlist } from "@prisma/client";
import Dropdown from "../ui/Dropdown";
import { Input } from "../ui/Input";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGameModal({ isOpen, onClose }: CreateGameModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [hostNickname, setHostNickname] = useState("");
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

    try {
      setIsCreating(true);
      const session = await createGame(selectedPlaylistId, hostNickname);
      if (session) {
        // Copy game code to clipboard
        navigator.clipboard.writeText(session.code);
        toast.success("Copied game code!");
        onClose();
      }
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

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
        </div>

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
