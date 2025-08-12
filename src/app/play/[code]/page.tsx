"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/effects/LoadingSpinner";
import useGameStore from "@/stores/gameStore";
import LobbyScreen from "../components/LobbyScreen";
import GameScreen from "../components/GameScreen";
import { useUserSync } from "@/hooks/useUserSync";

export default function PlayGamePage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const session = useGameStore((state) => state.session);
  const gameStatus = useGameStore((state) => state.session?.status);

  // Sync user data when signing in
  useUserSync();

  useEffect(() => {
    const code = params.code as string;

    if (!code) {
      setError("No game code provided");
      setIsLoading(false);
      return;
    }

    // Validate code format (6 characters, alphanumeric)
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError("Invalid game code format");
      setIsLoading(false);
      return;
    }

    // If we already have a session with this code, just show the appropriate component
    if (session && session.code === code) {
      setIsLoading(false);
      return;
    }

    // For now, just show the lobby and let them join
    setIsLoading(false);
  }, [params.code, session]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-gray-600">Joining game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Render the appropriate component based on game status
  if (!session) {
    return <LobbyScreen />;
  }

  // Determine which component to show based on game status
  switch (gameStatus) {
    case "ACTIVE":
      return <GameScreen />;
    case "WAITING":
    default:
      return <LobbyScreen />;
  }
}
