"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import useGameStore from "@/stores/gameStore";
import { usePusher } from "@/hooks/usePusher";
import { SongCard } from "./SongCard";
import { Playlist, Song } from "@prisma/client";
import { getAllSongs } from "@/services/songService";
import GuessModal from "./GuessModal";
import UserStats from "./UserStats";
import { useUser } from "@clerk/nextjs";
import { useUserExperience } from "@/hooks/useUserExperience";
import LoadingScreen from "@/components/LoadingScreen";

interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export default function GameScreen() {
  const session = useGameStore((state) => state.session);

  const leaveGame = useGameStore((state) => state.leaveGame);
  const [isLeaving, setIsLeaving] = useState(false);
  const { user } = useUser();
  const { addExperience } = useUserExperience();

  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [givenUp, setGivenUp] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [usedSongIds, setUsedSongIds] = useState<Set<string>>(new Set());

  // Listen for game start event
  usePusher(`session-${session?.id}`, "gameStarted", () => {
    toast.success("Game started!");
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLeaveGame = async () => {
    if (!session || isLeaving) return;

    setIsLeaving(true);
    try {
      // Add a small delay to ensure any ongoing widget operations complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      await leaveGame(session.id, session.players[0].id);
      toast.success("Left the game");
      window.location.href = "/";
    } catch (error) {
      console.error("Error leaving game:", error);
      toast.error("Failed to leave game");
    } finally {
      setIsLeaving(false);
    }
  };

  const selectRandomTrack = useCallback(() => {
    if (!session?.playlist) return;

    const playlistWithSongs = session.playlist as PlaylistWithSongs;
    if (!playlistWithSongs.songs || playlistWithSongs.songs.length === 0) {
      toast.error("No songs in playlist");
      return;
    }

    // Filter out used songs
    const availableSongs = playlistWithSongs.songs.filter((song) => !usedSongIds.has(song.id));

    if (availableSongs.length === 0) {
      toast.success("You've completed all songs in the playlist!");
      window.location.href = "/";
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const randomTrack = availableSongs[randomIndex];
    setCurrentTrack(randomTrack as Song);
    setUsedSongIds((prev) => new Set(prev).add(randomTrack.id));
    setIsCorrect(null);
    setGameOver(false);
    setGivenUp(false);
    setAttempts(0);

    // Reset timing to 1s for the next song
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("resetTiming"));
    }
  }, [session?.playlist, usedSongIds]);

  // Fetch songs and select random track when component mounts or playlist changes
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const songs = await getAllSongs();
        setAllSongs(songs);
        if (session?.playlist) {
          selectRandomTrack();
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load songs:", err);
        toast.error("Failed to load songs");
        setIsLoading(false);
      }
    };

    if (isClient) {
      fetchSongs();
    }
  }, [isClient, session?.playlist, selectRandomTrack]);

  const handleGuess = async (song: Song) => {
    if (!currentTrack || !session) return;

    const correct = song.id === currentTrack.id;
    setAttempts((prev) => prev + 1);
    setIsCorrect(correct);

    if (correct) {
      setGameOver(true);

      // Award experience points for correct guess
      if (user) {
        const basePoints = 10;
        const speedBonus = Math.max(0, 5 - attempts); // Bonus for fewer attempts
        const totalPoints = basePoints + speedBonus;

        await addExperience(totalPoints);

        toast.success(`Correct! 🎉 +${totalPoints} XP`, {
          duration: 2000,
          position: "top-center",
          style: {
            background: "#4CAF50",
            color: "white",
            fontSize: "1.1rem",
          },
        });
      } else {
        toast.success("Correct! 🎉", {
          duration: 2000,
          position: "top-center",
          style: {
            background: "#4CAF50",
            color: "white",
            fontSize: "1.1rem",
          },
        });
      }
    } else {
      toast.error("Not quite! Try again!", {
        duration: 2000,
        position: "top-center",
        style: {
          background: "#f44336",
          color: "white",
          fontSize: "1.1rem",
        },
      });
    }
  };

  const handleNextSong = () => {
    if (!gameOver) {
      // First click - reveal the answer
      setGivenUp(true);
      setGameOver(true);
      toast("Skipped song!", {
        duration: 2000,
        position: "top-center",
        style: {
          background: "#FF9800",
          color: "white",
          fontSize: "1.1rem",
        },
      });
    } else {
      // Second click - go to next song
      selectRandomTrack();
    }
  };

  if (!session || !session.playlist || !isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <LoadingScreen isLoading={true}>
        <div />
      </LoadingScreen>
    );
  }

  if (allSongs.length === 0) {
    return <div className="text-center p-4">No songs available</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* User Stats - Top Left */}
      <UserStats />

      <div className="absolute top-4 right-4">
        <button
          onClick={handleLeaveGame}
          disabled={isLeaving}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLeaving ? "Leaving..." : "Leave Game"}
        </button>
      </div>

      <main className="flex-1 flex flex-col p-4">
        {currentTrack && (
          <div className="flex-1 flex items-center justify-center mb-8">
            <SongCard
              trackUrl={currentTrack.permalinkUrl || ""}
              trackTitle={currentTrack.title}
              artistName={currentTrack.artist || "Unknown Artist"}
              onOpenGuessModal={() => setIsGuessModalOpen(true)}
              onGiveUp={handleNextSong}
              attempts={attempts}
              status={!gameOver && !givenUp ? "guessing" : isCorrect === true ? "correct" : "incorrect"}
            />
          </div>
        )}
      </main>

      <GuessModal
        isOpen={isGuessModalOpen}
        onClose={() => setIsGuessModalOpen(false)}
        songs={allSongs}
        onGuess={handleGuess}
        attempts={attempts}
      />
    </div>
  );
}
