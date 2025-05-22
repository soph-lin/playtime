"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import useGameStore from "@/stores/gameStore";
import { usePusher } from "@/hooks/usePusher";
import { SongCard } from "./SongCard";
import { Playlist, Song } from "@prisma/client";
import { getAllSongs } from "@/services/songService";
import GuessModal from "./GuessModal";

interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export default function GameScreen() {
  const session = useGameStore((state) => state.session);
  const setScreen = useGameStore((state) => state.setScreen);
  const leaveGame = useGameStore((state) => state.leaveGame);
  const [isLeaving, setIsLeaving] = useState(false);

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
    setScreen("game");
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  }, [isClient, session?.playlist]);

  const handleLeaveGame = async () => {
    if (!session || isLeaving) return;

    setIsLeaving(true);
    try {
      // Add a small delay to ensure any ongoing widget operations complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      await leaveGame(session.id, session.players[0].id);
      toast.success("Left the game");
      setScreen("menu");
    } catch (error) {
      console.error("Error leaving game:", error);
      toast.error("Failed to leave game");
    } finally {
      setIsLeaving(false);
    }
  };

  const selectRandomTrack = () => {
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
      setScreen("menu");
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
  };

  const handleGuess = (song: Song) => {
    setIsGuessModalOpen(false);
    // Immediately check the guess
    const correct = song.id === currentTrack?.id;
    setIsCorrect(correct);
    setAttempts((prev) => prev + 1);

    // Update player score for both correct and incorrect guesses
    if (session) {
      fetch(`/api/sessions/guess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: session.players[0].id,
          trackId: currentTrack?.id,
          correct: correct,
          sessionCode: session.code,
        }),
      });
    }

    if (correct) {
      setGameOver(true);
      toast.success("Correct! 🎉", {
        duration: 2000,
        position: "top-center",
        style: {
          background: "#4CAF50",
          color: "white",
          fontSize: "1.1rem",
        },
      });
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
    return <div className="text-center p-4">Loading game...</div>;
  }

  if (allSongs.length === 0) {
    return <div className="text-center p-4">No songs available</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
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
