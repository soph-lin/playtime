"use client";

import { useEffect, useState } from "react";
import MenuOption from "./MenuOption";
import AnimatedTitle from "../effects/AnimatedTitle";

interface MenuProps {
  options: string[];
  onConfirm: (option: string) => void;
}

export default function Menu({ options, onConfirm }: MenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [keyDownTime, setKeyDownTime] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showOptions) return;

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (!keyDownTime) {
          setKeyDownTime(Date.now());
          // Initial key press
          setSelectedIndex((prev) =>
            e.key === "ArrowUp" ? (prev > 0 ? prev - 1 : options.length - 1) : prev < options.length - 1 ? prev + 1 : 0
          );
        } else {
          // Handle key repeat
          const timeSinceLastChange = Date.now() - keyDownTime;
          if (timeSinceLastChange > 100) {
            // Adjust this value to control repeat speed
            setKeyDownTime(Date.now());
            setSelectedIndex((prev) =>
              e.key === "ArrowUp"
                ? prev > 0
                  ? prev - 1
                  : options.length - 1
                : prev < options.length - 1
                  ? prev + 1
                  : 0
            );
          }
        }
      } else if (e.key === "Enter") {
        onConfirm(options[selectedIndex]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        setKeyDownTime(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [options, selectedIndex, onConfirm, showOptions, keyDownTime]);

  return (
    <div className="w-full h-full flex flex-col gap-8 justify-center">
      <div className="relative">
        <AnimatedTitle
          text="Name that Tune! ♫"
          onComplete={() => {
            console.log("Title animation complete");
            setTimeout(() => setShowOptions(true), 500);
          }}
        />
      </div>
      {showOptions && (
        <div className="flex flex-col gap-6 ml-8">
          {options.map((option, index) => (
            <MenuOption
              key={option}
              text={option}
              isSelected={index === selectedIndex}
              delayMs={index * 200}
              className="text-4xl"
            />
          ))}
        </div>
      )}
    </div>
  );
}
