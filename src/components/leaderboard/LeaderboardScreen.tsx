"use client";

import { useEffect, useState } from "react";
import useGameStore from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Trophy, Clock, Target } from "@phosphor-icons/react";

interface LeaderboardPlayer {
  nickname: string;
  score: number;
  totalGuesses: number;
  accuracy: string;
  lastPlayed: string;
  playlist: string;
}

export default function LeaderboardScreen() {
  const setScreen = useGameStore((state) => state.setScreen);
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard");
        }
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleBack = () => {
    setScreen("menu");
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading leaderboard...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-white">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2 text-blue-600">
            <Trophy className="w-8 h-8 text-blue-600" />
            Leaderboard
          </h1>
          <Button onClick={handleBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <span className="flex items-center gap-2">
              Back to Menu
              <ArrowLeft size={20} />
            </span>
          </Button>
        </div>

        {players.length === 0 ? (
          <div className="text-center p-8 bg-blue-50 rounded-lg">
            <p className="text-blue-600">No players on the leaderboard yet!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {players.map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-300"
              >
                <div className="flex items-center space-x-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-200">
                    <span className="text-xl font-bold text-blue-700">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">{player.nickname}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-blue-600">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {player.accuracy}% accuracy
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(player.lastPlayed).toLocaleDateString()}
                      </span>
                      <span className="text-blue-700">{player.playlist}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{player.score} pts</div>
                  <div className="text-sm text-blue-600">{player.totalGuesses} guesses</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
