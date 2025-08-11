"use client";

import React, { useEffect } from "react";
import { Sprite } from "./Sprite";

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
  className?: string;
}

export default function DialogueStage({
  isOpen,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  character,
  text,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  blurBackground = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className,
}: DialogueStageProps) {
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

  if (!isOpen) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Sprite characterId="rock-guitar" size="medium" />
      <div className="bg-white rounded-lg p-4 w-1/2">
        <p>{text}</p>
      </div>
    </div>
  );
}
