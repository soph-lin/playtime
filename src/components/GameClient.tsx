"use client";

import { useEffect } from "react";
import MenuScreen from "@/components/menu/MenuScreen";
import LobbyScreen from "@/components/game/LobbyScreen";
import GameScreen from "@/components/game/GameScreen";
import LeaderboardScreen from "@/components/leaderboard/LeaderboardScreen";
import useGameStore from "@/stores/gameStore";

export default function GameClient() {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const setScreen = useGameStore((state) => state.setScreen);

  // Ensure we start at the menu screen on mount
  useEffect(() => {
    setScreen("menu");
  }, [setScreen]);

  return (
    <div>
      {currentScreen === "menu" && <MenuScreen />}
      {currentScreen === "lobby" && <LobbyScreen />}
      {currentScreen === "game" && <GameScreen />}
      {currentScreen === "leaderboard" && <LeaderboardScreen />}
    </div>
  );
}
