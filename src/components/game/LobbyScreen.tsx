"use client";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import useGameStore from "@/stores/gameStore";
import { Copy, Play, SignOut } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { GAME_CONFIG } from "@/constants/game";
import { usePusher } from "@/hooks/usePusher";

export default function LobbyScreen() {
  const session = useGameStore((state) => state.session);
  const leaveGame = useGameStore((state) => state.leaveGame);
  const setScreen = useGameStore((state) => state.setScreen);
  const startGame = useGameStore((state) => state.startGame);
  const joinGame = useGameStore((state) => state.joinGame);

  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Listen for player left events
  usePusher(`session-${session?.id}`, "playerLeft", (data) => {
    toast(`${data.nickname} left the game`);
  });

  // Listen for host change events
  usePusher(`session-${session?.id}`, "hostChanged", (data) => {
    toast(`${data.nickname} became the new host!`);
  });

  // Listen for player joined events
  usePusher(`session-${session?.id}`, "playerJoined", (data) => {
    // Only show toast if the joining player is not the current user and if the current user is already in the game
    if (
      session &&
      data.userId !== session.userId &&
      session.players.some((player) => player.userId === session.userId)
    ) {
      toast(`${data.nickname} joined the game!`);
    }
  });

  if (!session) {
    return null;
  }

  const copyCode = () => {
    navigator.clipboard.writeText(session.code);
  };

  const handleNicknameSubmit = async () => {
    // Validate nickname
    if (nickname.length < GAME_CONFIG.MIN_NICKNAME_LENGTH) {
      toast.error(`Nickname must be at least ${GAME_CONFIG.MIN_NICKNAME_LENGTH} characters`);
      return;
    }

    if (nickname.length > GAME_CONFIG.MAX_NICKNAME_LENGTH) {
      toast.error(`Nickname must be at most ${GAME_CONFIG.MAX_NICKNAME_LENGTH} characters`);
      return;
    }

    if (!GAME_CONFIG.ALLOWED_NICKNAME_CHARS.test(nickname)) {
      toast.error("Nickname can only contain letters, numbers, spaces, hyphens, and underscores");
      return;
    }

    setIsSubmitting(true);
    try {
      await joinGame(session.code, nickname);
    } catch (error: unknown) {
      console.error("Failed to join game:", error);
      toast.error("Failed to join game. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!session) return;

    try {
      setIsLeaving(true);
      // Find the current player
      const currentPlayer = session.players.find((player) => player.userId === session.userId);

      if (!currentPlayer) {
        console.error("Current player not found");
        return;
      }

      await leaveGame(session.id, currentPlayer.id);
      setScreen("menu");
    } catch (error) {
      console.error("Error leaving game:", error);
      toast.error("Failed to leave game");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleStartGame = async () => {
    try {
      setIsStarting(true);
      await startGame();
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    } finally {
      setIsStarting(false);
    }
  };

  // Check if current user is already in the game
  const isExistingPlayer = session.players.some((player) => player.userId === session.userId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Game Code</h1>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <span className="text-4xl font-mono font-bold text-primary">{session.code}</span>
            <Button onClick={copyCode} variant="ghost" size="icon" className="text-gray-500 hover:text-primary">
              <Copy size={24} />
            </Button>
          </div>
        </div>

        {!isExistingPlayer ? (
          // New player form
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Enter Your Nickname</h2>
            <div className="flex gap-2">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Your nickname"
                className="flex-1"
                maxLength={GAME_CONFIG.MAX_NICKNAME_LENGTH}
              />
              <Button onClick={handleNicknameSubmit} disabled={isSubmitting} className="bg-primary">
                {isSubmitting ? "Joining..." : "Join"}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {GAME_CONFIG.MIN_NICKNAME_LENGTH}-{GAME_CONFIG.MAX_NICKNAME_LENGTH} characters, letters, numbers, spaces,
              hyphens, and underscores only
            </p>
          </div>
        ) : (
          // Existing player view
          <>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Players</h2>
              <div className="space-y-2">
                {session.players.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      {player.nickname}
                      {index === 0 && " (Host)"}
                    </span>
                    <span className="text-sm text-gray-500">Score: {player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={handleLeaveGame} variant="outline" className="text-gray-700" disabled={isLeaving}>
                <span className="flex items-center gap-2">
                  {isLeaving ? "Leaving..." : "Leave Game"}
                  <SignOut size={20} />
                </span>
              </Button>
              {session.userId === session.userId && (
                <Button onClick={handleStartGame} className="bg-primary" disabled={isStarting}>
                  <span className="flex items-center gap-2">
                    {isStarting ? "Starting..." : "Start Game"}
                    <Play size={20} />
                  </span>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
