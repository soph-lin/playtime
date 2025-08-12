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

interface DialogueTree {
  id: string;
  title: string;
  characterName: string;
  nodes: Array<{
    id: string;
    type: "DIALOGUE" | "OPTION" | "EVENT" | "CONDITION";
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  connections: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    [key: string]: unknown;
  }>;
  metadata: Record<string, unknown>;
}

interface DialogueState {
  isOpen: boolean;
  currentDialogue: DialogueData | null;
  dialogueTree: DialogueTree | null;
  currentNodeIndex: number;
  onDialogueEnd?: () => void;

  openDialogue: (dialogue: DialogueData, tree?: DialogueTree, onEnd?: () => void) => void;
  closeDialogue: () => void;
  nextDialogue: () => void;
  progressDialogue: () => void;
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  isOpen: false,
  currentDialogue: null,
  dialogueTree: null,
  currentNodeIndex: 0,
  onDialogueEnd: undefined,

  openDialogue: (dialogue: DialogueData, tree?: DialogueTree, onEnd?: () => void) => {
    set({
      isOpen: true,
      currentDialogue: dialogue,
      dialogueTree: tree || null,
      currentNodeIndex: 0,
      onDialogueEnd: onEnd,
    });
  },

  closeDialogue: () => {
    const { onDialogueEnd } = get();
    if (onDialogueEnd) {
      onDialogueEnd();
    }
    set({
      isOpen: false,
      currentDialogue: null,
      dialogueTree: null,
      currentNodeIndex: 0,
      onDialogueEnd: undefined,
    });
  },

  nextDialogue: () => {
    const { dialogueTree, currentNodeIndex } = get();
    if (!dialogueTree) return;

    const nextNode = dialogueTree.nodes[currentNodeIndex + 1];
    if (nextNode) {
      const nextDialogue: DialogueData = {
        character: {
          id: dialogueTree.characterName,
          name: dialogueTree.characterName,
          expression: (nextNode.data.expression as "happy" | "nervous" | "sad" | "angry" | "neutral") || "happy",
        },
        text: (nextNode.data.text as string) || "Next dialogue...",
        options: [
          {
            id: "continue",
            text: "Continue...",
            onSelect: () => get().nextDialogue(),
          },
        ],
      };

      set({
        currentDialogue: nextDialogue,
        currentNodeIndex: currentNodeIndex + 1,
      });
    } else {
      // End of dialogue
      get().closeDialogue();
    }
  },

  progressDialogue: () => {
    get().nextDialogue();
  },
}));
