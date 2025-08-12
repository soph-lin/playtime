import type { DialogueData, DialogueTree, DialogueNode } from "@/types/dialogue";

/**
 * Converts a dialogue node to the format expected by the dialogue store
 */
export function convertNodeToDialogueData(node: DialogueNode, characterName: string): DialogueData {
  return {
    character: {
      id: characterName,
      name: characterName,
      expression: (node.data.expression as "happy" | "nervous" | "sad" | "angry" | "neutral") || "neutral",
    },
    text: (node.data.text as string) || "Dialogue...",
    options:
      (node.data.options as Array<{ id: string; text: string; targetNodeId: string }>)?.map((option) => ({
        id: option.id,
        text: option.text,
        onSelect: () => {
          // This will be set by the calling code
          console.log(`Option clicked: ${option.text}, navigating to: ${option.targetNodeId}`);
        },
      })) || [],
  };
}

/**
 * Prepares a dialogue tree for playtest by converting the start node to dialogue format
 * and setting up proper option navigation
 */
export function prepareDialogueForPlaytest(
  tree: DialogueTree,
  onNavigateToNode: (nodeId: string) => void
): DialogueData | null {
  if (!tree.nodes || tree.nodes.length === 0) {
    console.warn("Dialogue tree has no nodes");
    return null;
  }

  const startNode = tree.nodes[0];
  if (startNode.type !== "DIALOGUE") {
    console.warn("Start node is not a dialogue node");
    return null;
  }

  // Convert the start node to dialogue format
  const dialogue = convertNodeToDialogueData(startNode, tree.characterName);

  // Set the onSelect handlers for options to navigate to target nodes
  if (dialogue.options) {
    dialogue.options.forEach((option, index) => {
      const originalOption = startNode.data.options?.[index];
      if (originalOption) {
        option.onSelect = () => onNavigateToNode(originalOption.targetNodeId);
      }
    });
  }

  return dialogue;
}

/**
 * Gets the start node of a dialogue tree
 */
export function getStartNode(tree: DialogueTree): DialogueNode | null {
  if (!tree.nodes || tree.nodes.length === 0) return null;
  return tree.nodes[0];
}

/**
 * Checks if a dialogue tree is ready for playtest
 */
export function isDialogueTreePlaytestReady(tree: DialogueTree): boolean {
  if (!tree.nodes || tree.nodes.length === 0) return false;

  const startNode = tree.nodes[0];
  if (startNode.type !== "DIALOGUE") return false;

  // Check if start node has content
  if (!startNode.data.text || startNode.data.text.trim() === "") return false;

  return true;
}

/**
 * Finds the next available node number for naming new nodes
 */
export function findNextAvailableNodeNumber(nodes: DialogueNode[]): number {
  if (nodes.length === 0) return 1;

  const nodeNumbers = nodes
    .map((node) => {
      const match = node.name.match(/^Node (\d+)$/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter((num) => num > 0)
    .sort((a, b) => a - b);

  if (nodeNumbers.length === 0) return 1;

  // Find the first gap or use the next number
  for (let i = 1; i <= nodeNumbers[nodeNumbers.length - 1] + 1; i++) {
    if (!nodeNumbers.includes(i)) {
      return i;
    }
  }
  return nodeNumbers[nodeNumbers.length - 1] + 1;
}

/**
 * Creates a new dialogue node with default values
 */
export function createNewDialogueNode(position: { x: number; y: number }, nodeNumber: number): DialogueNode {
  return {
    id: `node_${Date.now()}`,
    type: "DIALOGUE",
    name: `Node ${nodeNumber}`,
    position,
    data: {
      text: "New dialogue text",
      expression: "neutral",
      options: [],
      autoAdvance: false,
    },
  };
}

/**
 * Validates that a dialogue tree has proper connections
 */
export function validateDialogueTree(tree: DialogueTree): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for nodes without options
  const nodesWithoutOptions = tree.nodes.filter((node) => !node.data.options || node.data.options.length === 0);
  if (nodesWithoutOptions.length > 0) {
    errors.push(`Nodes without options: ${nodesWithoutOptions.map((n) => n.name).join(", ")}`);
  }

  // Check for broken option connections
  const brokenConnections = tree.nodes
    .filter((node) => node.data.options && node.data.options.length > 0)
    .flatMap((node) =>
      (node.data.options || [])
        .filter((option) => {
          const targetExists = tree.nodes.some((n) => n.id === option.targetNodeId);
          return !targetExists;
        })
        .map((option) => ({
          nodeName: node.name,
          optionText: option.text,
          targetId: option.targetNodeId,
        }))
    );

  if (brokenConnections.length > 0) {
    errors.push(
      `Broken connections: ${brokenConnections
        .map((c) => `"${c.optionText}" in ${c.nodeName} → ${c.targetId}`)
        .join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets all nodes that can be targeted by options (excluding the current node)
 */
export function getAvailableTargetNodes(
  nodes: DialogueNode[],
  excludeNodeId: string
): Array<{ value: string; label: string }> {
  return nodes
    .filter((n) => n.id !== excludeNodeId && n.type === "DIALOGUE")
    .map((n) => ({
      value: n.id,
      label: n.name,
    }));
}

/**
 * Validates and sanitizes a node name, ensuring it's never empty
 */
export function sanitizeNodeName(name: string, existingNodes: DialogueNode[]): string {
  const trimmedName = name.trim();
  if (trimmedName) {
    return trimmedName;
  }

  // If name is empty, generate a new one
  return `Node ${findNextAvailableNodeNumber(existingNodes)}`;
}

/**
 * Creates a new option for a dialogue node
 */
export function createNewDialogueOption(): { id: string; text: string; targetNodeId: string } {
  return {
    id: `option_${Date.now()}`,
    text: "Option",
    targetNodeId: "",
  };
}
