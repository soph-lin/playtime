"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getCharacterComponent } from "@/constants/characterInformation";
import "./dialogue-animations.css";
import { ParticleContainer } from "../effects/particle";
import { getParticleEffect } from "@/constants/characterInformation";
import "../effects/particle/particle-effects.css";

interface SpriteProps {
  characterId: string;
  expression?: "happy" | "nervous" | "sad" | "angry" | "neutral";
  size?: "small" | "medium" | "large";
  className?: string;
}

// Size classes with pixel values for the new size prop system
const SIZE_VALUES = {
  small: 64,
  medium: 128,
  large: 256,
};

export function Sprite({ characterId, expression = "neutral", size = "medium", className }: SpriteProps) {
  const Character = getCharacterComponent(characterId);
  const sizeValue = SIZE_VALUES[size];

  if (!Character) {
    console.warn(`Character not found: ${characterId}`);
    return (
      <div className={cn("flex items-center justify-center bg-gray-200 rounded-lg text-gray-500", className)}>
        <span className="text-sm">?</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {(() => {
        const particleEffect = getParticleEffect(expression);
        return particleEffect ? (
          <ParticleContainer
            particles={particleEffect.particles}
            icon={<span>{particleEffect.icon}</span>}
            iconClassName={particleEffect.className}
            expression={expression}
          >
            {/* Character Sprite */}
            <div className="sprite-idle z-dropdown">
              <Character size={sizeValue} />
            </div>
          </ParticleContainer>
        ) : (
          /* Character Sprite without particles */
          <div className="sprite-idle">
            <Character size={sizeValue} />
          </div>
        );
      })()}
    </div>
  );
}
