"use client";

import { useState } from "react";
import Menu from "@/components/menu/Menu";
import MenuSidePanel from "@/components/menu/MenuSidePanel";
import StartGameModal from "@/components/menu/StartGameModal";
import ScrollingBackground from "@/components/background/ScrollingBackground";
import { Canvas } from "@react-three/fiber";
import FlatRecord from "@/components/3d/FlatRecord";
import useGameStore from "@/stores/gameStore";

export default function MenuScreen() {
  const [selectedOption, setSelectedOption] = useState<string>("Start Game");
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [showStartGameModal, setShowStartGameModal] = useState<boolean>(false);
  const setScreen = useGameStore((state) => state.setScreen);
  const menuOptions = ["Start Game", "Leaderboard", "How to Play", "Settings", "Credits"];

  const getContentForOption = (option: string) => {
    switch (option) {
      case "How to Play":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mt-6">Game Objective</h3>
            <p>Pick a playlist and try to guess the song through hearing as little of the song as possible.</p>
            <p>You can choose to play with a friend or by yourself.</p>
            <p>The default start time is 1 second, but you can change it in the settings.</p>
            <p>
              You can increase the audio playback time for each song by clicking the + button in the Playback up to a
              maximum of 5 seconds.
            </p>
            <p>Make as many guesses as you like, but remember that your points decrease with each attempt!</p>
          </div>
        );

      case "Settings":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">Audio</h3>
              <div className="flex items-center space-x-4">
                <span>Music Volume:</span>
                <input type="range" min="0" max="100" defaultValue="80" className="w-full" />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span>Start Seconds Time:</span>
                <input type="range" min="1" max="5" defaultValue="1" className="w-full" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">Graphics</h3>
              <div className="flex items-center space-x-2">
                <span>Quality:</span>
                <select className="px-2 py-1 rounded">
                  <option>Low</option>
                  <option selected>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "Credits":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Development Team</h3>

            <div className="mt-6">
              <p className="text-lg">Team 41 - CS222 @ UIUC</p>
              <br></br>
              <p className="text-md">Kaavya Mahajan</p>
              <p className="text-md">Sophie Lin</p>
              <p className="text-md">Sriram Koritala</p>
              <p className="text-md">Zia Liu</p>
              {/* <p className="text-sm">Made with ❤️ by Team 41 for CS222 @ UIUC</p> */}
            </div>
          </div>
        );

      default:
        return <div>Select an option from the menu</div>;
    }
  };

  const handleConfirm = (option: string) => {
    setSelectedOption(option);
    if (option === "Start Game") {
      setShowStartGameModal(true);
    } else if (option === "Leaderboard") {
      setScreen("leaderboard");
    } else {
      setShowSidePanel(true);
    }
  };

  return (
    <div className="min-h-screen flex">
      <ScrollingBackground />
      <div className="w-full h-full px-4 py-8 flex flex-row items-center justify-center">
        <div className="w-1/2">
          <Menu options={menuOptions} onConfirm={handleConfirm} />
        </div>
        <div className="flex justify-center items-center">
          <Canvas camera={{ position: [0, 0, 10], fov: 50 }} style={{ width: "550px", height: "550px" }}>
            <ambientLight intensity={1} />
            <FlatRecord />
          </Canvas>
          <MenuSidePanel
            title={selectedOption}
            content={getContentForOption(selectedOption)}
            isOpen={showSidePanel}
            onClose={() => setShowSidePanel(false)}
          />
        </div>
        <StartGameModal isOpen={showStartGameModal} setIsOpen={setShowStartGameModal} />
      </div>
    </div>
  );
}
