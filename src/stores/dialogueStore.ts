import { create } from "zustand";

export interface DialogueOption {
  id: string;
  text: string;
  onSelect: () => void;
}

export interface DialogueData {
  character: {
    id: string;
    name: string;
    expression?: "happy" | "nervous" | "sad" | "angry" | "neutral";
  };
  text: string;
  options?: DialogueOption[];
}

interface DialogueState {
  // Current dialogue state
  isOpen: boolean;
  currentDialogue: DialogueData | null;
  
  // Actions
  openDialogue: (dialogue: DialogueData) => void;
  closeDialogue: () => void;
  nextDialogue: () => void;
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  isOpen: false,
  currentDialogue: null,

  openDialogue: (dialogue: DialogueData) => {
    set({
      isOpen: true,
      currentDialogue: dialogue,
    });
  },

  closeDialogue: () => {
    set({
      isOpen: false,
      currentDialogue: null,
    });
  },

  nextDialogue: () => {
    // For now, just close the dialogue
    // Later we can implement dialogue queues
    get().closeDialogue();
  },
}));
