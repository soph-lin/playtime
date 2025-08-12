import Blues from "@/assets/characters/Blues";
import Drum from "@/assets/characters/Drum";
import Sitar from "@/assets/characters/Sitar";
import BongoDrum from "@/assets/characters/BongoDrum";
import Maracas from "@/assets/characters/Maracas";
import RockGuitar from "@/assets/characters/RockGuitar";
import Accordion from "@/assets/characters/Accordion";

export interface Character {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<{ size?: number }>;
}

export const CHARACTERS: Character[] = [
  { id: "blues", name: "Blues", icon: "🎵", component: Blues },
  { id: "drum", name: "Drum", icon: "🥁", component: Drum },
  { id: "sitar", name: "Sitar", icon: "🎸", component: Sitar },
  { id: "bongo-drum", name: "Bongo Drum", icon: "🥁", component: BongoDrum },
  { id: "maracas", name: "Maracas", icon: "🎵", component: Maracas },
  { id: "rock-guitar", name: "Rock Guitar", icon: "🎸", component: RockGuitar },
  { id: "accordion", name: "Accordion", icon: "🪗", component: Accordion },
];

// Helper function to get character by ID
export const getCharacter = (id: string): Character | undefined => {
  return CHARACTERS.find((char) => char.id === id);
};

// Helper function to get character component by ID
export const getCharacterComponent = (id: string) => {
  const character = getCharacter(id);
  return character?.component;
};

// Helper function to get character icon by ID
export const getCharacterIcon = (id: string): string => {
  const character = getCharacter(id);
  return character?.icon || "🎭";
};

// Expression-based particle effects
export interface Particle {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly delay: number;
  readonly size: number;
}

export interface ParticleConfig {
  particles: readonly Particle[];
  icon: string;
  className: string;
}

export const EXPRESSION_EFFECTS: Record<string, ParticleConfig> = {
  happy: {
    particles: [
      { id: 1, x: 50, y: -10, delay: 0, size: 18 }, // Above top center sparkle
      { id: 2, x: 25, y: -5, delay: 0, size: 16 }, // Left arc above
      { id: 3, x: 75, y: -5, delay: 0, size: 16 }, // Right arc above
      { id: 4, x: 15, y: 2, delay: 0, size: 14 }, // Left edge
      { id: 5, x: 85, y: 2, delay: 0, size: 14 }, // Right edge
      { id: 6, x: 40, y: -2, delay: 0, size: 15 }, // Left inner above
      { id: 7, x: 60, y: -2, delay: 0, size: 15 }, // Right inner above
    ],
    icon: "✨",
    className: "text-yellow-400",
  },
  nervous: {
    particles: [
      { id: 1, x: 50, y: -3, delay: 0, size: 16 }, // Center of small semicircle
      { id: 2, x: 45, y: -2, delay: 0.15, size: 16 }, // Left of center
      { id: 3, x: 55, y: -2, delay: 0.3, size: 16 }, // Right of center
      { id: 4, x: 40, y: -1, delay: 0.45, size: 16 }, // Left edge of small semicircle
      { id: 5, x: 60, y: -1, delay: 0.6, size: 16 }, // Right edge of small semicircle
      { id: 6, x: 35, y: 0, delay: 0.75, size: 16 }, // Left inner
      { id: 7, x: 65, y: 0, delay: 0.9, size: 16 }, // Right inner
      { id: 8, x: 50, y: 1, delay: 1.05, size: 16 }, // Bottom center
    ],
    icon: "💧",
    className: "text-blue-400",
  },
  sad: {
    particles: [
      { id: 1, x: 50, y: -5, delay: 0, size: 16 }, // Center top
      { id: 2, x: 35, y: -3, delay: 0.8, size: 14 }, // Left of center, more delayed
      { id: 3, x: 65, y: -3, delay: 1.6, size: 14 }, // Right of center, even more delayed
      { id: 4, x: 25, y: -1, delay: 2.4, size: 12 }, // Left edge, much more delayed
      { id: 5, x: 75, y: -1, delay: 3.2, size: 12 }, // Right edge, most delayed
    ],
    icon: "💧",
    className: "text-blue-400",
  },
  angry: {
    particles: [
      { id: 1, x: 85, y: -8, delay: 0, size: 48 }, // Very big angry burst in top right
    ],
    icon: "💥",
    className: "text-red-500",
  },
} as const;

export type ExpressionType = keyof typeof EXPRESSION_EFFECTS;

/**
 * Gets the particle effect configuration for a given expression, with fallback to neutral
 */
export function getParticleEffect(
  expression: "happy" | "nervous" | "sad" | "angry" | "neutral"
): ParticleConfig | null {
  if (expression === "neutral") return null;
  return EXPRESSION_EFFECTS[expression] || null;
}
