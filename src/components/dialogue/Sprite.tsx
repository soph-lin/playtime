"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Import character sprites
import Blues from "@/assets/blues";
import Drum from "@/assets/drum";
import Sitar from "@/assets/sitar";
import BongoDrum from "@/assets/bongo-drum";
import Maracas from "@/assets/maracas";
import RockGuitar from "@/assets/rock-guitar";
import Accordion from "@/assets/accordion";

interface SpriteProps {
  characterId: string;
  expression?: "happy" | "nervous" | "sad" | "angry" | "neutral";
  size?: "small" | "medium" | "large";
  className?: string;
}

// Character sprite mapping
const CHARACTERS = {
  blues: Blues,
  drum: Drum,
  sitar: Sitar,
  "bongo-drum": BongoDrum,
  maracas: Maracas,
  "rock-guitar": RockGuitar,
  accordion: Accordion,
};

// Expression-based particle effects
const EXPRESSION_EFFECTS = {
  happy: "sparkle-effect",
  nervous: "sweat-effect",
  sad: "storm-effect",
  angry: "burst-effect",
  neutral: "",
};

// Size classes with pixel values for the new size prop system
const SIZE_VALUES = {
  small: 64,
  medium: 128,
  large: 256,
};

export function Sprite({ characterId, expression = "neutral", size = "medium", className }: SpriteProps) {
  const Character = CHARACTERS[characterId as keyof typeof CHARACTERS];
  const sizeValue = SIZE_VALUES[size];

  if (!Character) {
    console.warn(`Character not found: ${characterId}`);
    return (
      <div className={cn("flex items-center justify-center bg-gray-200 rounded-lg text-gray-500", className)}>
        <span className="text-sm">?</span>
      </div>
    );
  }

  const effectClass = EXPRESSION_EFFECTS[expression];

  return (
    <div className={cn("relative", className)}>
      {/* Character Sprite */}
      <div className={cn("sprite-idle", effectClass && "relative")}>
        <Character size={sizeValue} />
      </div>

      {/* Expression Effects */}
      {expression !== "neutral" && (
        <div className="absolute inset-0 pointer-events-none">
          {expression === "happy" && <SparkleEffect />}
          {expression === "nervous" && <SweatEffect />}
          {expression === "sad" && <StormEffect />}
          {expression === "angry" && <BurstEffect />}
        </div>
      )}
    </div>
  );
}

// Particle Effect Components
function SparkleEffect() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full sparkle"
          style={{
            left: `${20 + i * 15}%`,
            top: `${10 + i * 20}%`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </>
  );
}

function SweatEffect() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full sweat-drop"
          style={{
            left: `${15 + i * 10}%`,
            top: "0%",
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </>
  );
}

function StormEffect() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 bg-gray-600 rounded-full storm-cloud"
          style={{
            left: `${10 + i * 20}%`,
            top: `${5 + i * 15}%`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </>
  );
}

function BurstEffect() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-red-500 rounded-full burst-cloud"
          style={{
            left: `${20 + i * 15}%`,
            top: `${15 + i * 10}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </>
  );
}
