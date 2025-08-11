"use client";

import React, { useEffect, useState } from "react";
import { Sprite } from "./Sprite";
import RippleText from "../effects/RippleText";

interface DialogueStageProps {
  isOpen: boolean;
  onClose: () => void;
  character: {
    id: string;
    name: string;
    expression?: "happy" | "nervous" | "sad" | "angry" | "neutral";
  };
  text: string;
  options?: Array<{
    id: string;
    text: string;
    onSelect: () => void;
  }>;
  blurBackground?: boolean;
}

export default function DialogueStage({
  isOpen,
  onClose,
  character,
  text,
  options = [],
  blurBackground = true,
}: DialogueStageProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [keyDownTime, setKeyDownTime] = useState<number | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle keyboard navigation for options
  useEffect(() => {
    if (!isOpen || !showOptions || options.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
        options[selectedIndex]?.onSelect();
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
  }, [isOpen, showOptions, options, selectedIndex, keyDownTime]);

  // Reset state when dialogue opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setShowOptions(false);
      setDisplayedText("");
      setIsTyping(true);

      // Start typing animation
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
          // Show options after typing completes
          setTimeout(() => setShowOptions(true), 500);
        }
      }, 30); // Adjust speed here

      return () => clearInterval(typeInterval);
    }
  }, [isOpen, text]);

  if (!isOpen) return null;

  return (
    <>
      {/* Blur background */}
      {blurBackground && <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-sm" />}

      {/* Dialogue container */}
      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-end gap-6 z-10 pb-6">
        {/* Character sprite */}
        <div className="flex flex-col items-center gap-2">
          <Sprite characterId={character.id} size="large" />
        </div>

        {/* Dialogue container */}
        <div className="flex flex-col gap-4 bg-white rounded-lg p-6 shadow-xl border-2 border-cerulean w-2/3 max-w-7xl min-h-[200px]">
          {/* Dialogue box with fixed dimensions */}
          {/* Character name in top left corner */}
          <div>
            <RippleText
              text={character.name}
              className="text-3xl font-bold text-white"
              outline="cerulean"
              outlineSize="sm"
            />
          </div>

          {/* Dialogue text with typing animation - fixed height */}
          <div className="flex-1">
            <p className="text-md leading-relaxed text-slate-800 break-words">
              {displayedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </div>

          {/* Dialogue options */}
          <div className="min-h-[120px]">
            {showOptions && options.length > 0 && (
              <div className="space-y-2 text-md">
                {options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`p-2 rounded-lg cursor-pointer transition-all duration-200 dialogue-option ${
                      index === selectedIndex
                        ? "bg-cerulean text-white scale-103 shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200 text-slate-700"
                    }`}
                    onClick={() => option.onSelect()}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      opacity: 0,
                      animation: "fadeInUp 0.3s ease-out forwards",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {index === selectedIndex && <span className="text-white font-bold">▶</span>}
                      <span className="font-medium break-words">{option.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add CSS for cascade animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
