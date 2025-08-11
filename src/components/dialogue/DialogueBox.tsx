"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Sprite } from "./Sprite";

interface DialogueBoxProps {
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

export function DialogueBox({
  isOpen,
  onClose,
  character,
  text,
  options = [],
  blurBackground = true,
  className,
}: DialogueBoxProps) {
  const dialogueRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end p-4">
      {/* Backdrop */}
      <div className={cn("absolute inset-0 bg-black/20", blurBackground && "backdrop-blur-sm")} onClick={onClose} />

      {/* Dialogue Container with Sprite */}
      <div className="relative">
        {/* Dialogue Box */}
        <div
          ref={dialogueRef}
          className={cn(
            "w-full max-w-4xl rounded-2xl border-2 border-cerulean bg-white p-6 shadow-lg transition-all duration-300 ease-out",
            isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <Sprite characterId={character.id} expression={character.expression || "neutral"} size="small" />
          </div>
          {/* Dialogue Content */}
          <div className="text-center">
            {/* Character Name */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{character.name}</h3>
            </div>

            {/* Dialogue Text */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed text-lg">{text}</p>
            </div>

            {/* Dialogue Options */}
            {options.length > 0 && (
              <div className="space-y-2 max-w-md mx-auto">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.onSelect}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-cerulean hover:bg-cerulean/5 transition-colors duration-200"
                  >
                    <span className="text-gray-700">{option.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
