// Dialogue System Types
// This file contains all type definitions for the dialogue system

// Character expression types
export type CharacterExpression = "happy" | "nervous" | "sad" | "angry" | "neutral";

// Dialogue option structure (as stored in database)
export interface DialogueOptionData {
  id: string;
  text: string;
  targetNodeId: string;
}

// Dialogue option structure (as used in dialogue store)
export interface DialogueOption {
  id: string;
  text: string;
  onSelect: () => void;
}

// Dialogue node data structure
export interface DialogueNodeData {
  text?: string;
  expression?: CharacterExpression;
  options?: DialogueOptionData[];
  autoAdvance?: boolean;
  [key: string]: unknown;
}

// Dialogue node structure
export interface DialogueNode {
  id: string;
  type: "DIALOGUE";
  name: string;
  position: { x: number; y: number };
  data: DialogueNodeData;
}

// Node connection structure
export interface DialogueConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  [key: string]: unknown;
}

// Dialogue metadata structure
export interface DialogueMetadata {
  description?: string;
  tags?: string[];
  createdAt?: string;
  [key: string]: unknown;
}

// Complete dialogue tree structure
export interface DialogueTree {
  id: string;
  title: string;
  characterName: string;
  nodes: DialogueNode[];
  connections: DialogueConnection[];
  metadata: DialogueMetadata;
}

// Dialogue data for the dialogue store (what gets displayed)
export interface DialogueData {
  character: {
    id: string;
    name: string;
    expression?: CharacterExpression;
  };
  text: string;
  options?: DialogueOption[];
}

// Dialogue store state
export interface DialogueState {
  isOpen: boolean;
  currentDialogue: DialogueData | null;
  dialogueTree: DialogueTree | null;
  currentNodeIndex: number;
  onDialogueEnd?: () => void;

  openDialogue: (dialogue: DialogueData, tree?: DialogueTree, onEnd?: () => void) => void;
  closeDialogue: () => void;
  nextDialogue: () => void;
  navigateToNode: (nodeId: string) => void;
  progressDialogue: () => void;
}

// Character information
export interface Character {
  id: string;
  name: string;
  sprite: React.ComponentType<{ size?: number }>;
  expressions: Record<string, unknown>;
  defaultExpression: CharacterExpression;
}
