import { create } from "zustand";
import type { DialogueData, DialogueTree, DialogueState } from "@/types/dialogue";

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
          expression: (nextNode.data.expression as "happy" | "nervous" | "sad" | "angry" | "neutral") || "neutral",
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

  // Navigate to a specific node by ID (for option navigation)
  navigateToNode: (nodeId: string) => {
    const { dialogueTree } = get();
    if (!dialogueTree) return;

    const targetNode = dialogueTree.nodes.find((node) => node.id === nodeId);
    if (!targetNode) {
      console.warn(`Target node not found: ${nodeId}`);
      return;
    }

    // Find the index of the target node
    const targetIndex = dialogueTree.nodes.findIndex((node) => node.id === nodeId);
    if (targetIndex === -1) return;

    // Debug: Log the target node data
    console.log("Target node data:", targetNode.data);
    console.log("Target node options:", targetNode.data.options);

    // Safely extract options with better type handling
    let options: Array<{ id: string; text: string; onSelect: () => void }> = [];

    if (targetNode.data.options && Array.isArray(targetNode.data.options)) {
      options = targetNode.data.options.map((option: { id: string; text: string; targetNodeId: string }) => {
        console.log("Processing option:", option);
        return {
          id: option.id,
          text: option.text,
          onSelect: () => {
            console.log(`Option clicked: ${option.text}, navigating to: ${option.targetNodeId}`);
            get().navigateToNode(option.targetNodeId);
          },
        };
      });
    }

    // Convert the target node to dialogue format
    const targetDialogue: DialogueData = {
      character: {
        id: dialogueTree.characterName,
        name: dialogueTree.characterName,
        expression: (targetNode.data.expression as "happy" | "nervous" | "sad" | "angry" | "neutral") || "neutral",
      },
      text: (targetNode.data.text as string) || "Dialogue...",
      options: options,
    };

    console.log("Created target dialogue:", targetDialogue);

    set({
      currentDialogue: targetDialogue,
      currentNodeIndex: targetIndex,
    });
  },

  progressDialogue: () => {
    get().nextDialogue();
  },
}));
