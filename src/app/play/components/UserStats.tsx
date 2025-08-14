"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import useGameStore from "@/stores/gameStore";
import { getAllSongs } from "@/services/songService";
import { Song } from "@prisma/client";

interface GameStats {
  score: number;
  songsCompleted: number;
  totalSongs: number;
}

export default function UserStats() {
  const { user } = useUser();
  const session = useGameStore((state) => state.session);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && user) {
      fetchSongsAndUpdateStats();
    }
  }, [session, user]);

  const fetchSongsAndUpdateStats = async () => {
    try {
      const songs = await getAllSongs();
      updateStats(songs);
    } catch (error) {
      console.error("Error fetching songs:", error);
      setLoading(false);
    }
  };

  const updateStats = (songs: Song[]) => {
    if (!session) return;

    // Find the current user in the session
    const currentPlayer = session.players.find((p) => p.userId === user?.id);

    if (currentPlayer) {
      const totalSongs = songs.length;
      setStats({
        score: currentPlayer.score || 0,
        songsCompleted: currentPlayer.correct || 0,
        totalSongs,
      });
    }

    setLoading(false);
  };

  if (!user || loading || !session) {
    return null;
  }

  if (!stats) {
    return null;
  }

  const progressPercentage = stats.totalSongs > 0 ? (stats.songsCompleted / stats.totalSongs) * 100 : 0;

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.score}</div>
            <div className="text-xs text-gray-300">Points</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {stats.songsCompleted}/{stats.totalSongs}
            </div>
            <div className="text-xs text-gray-300">Songs</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-32">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>{stats.songsCompleted}</span>
            <span>{stats.totalSongs}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
