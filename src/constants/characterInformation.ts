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
