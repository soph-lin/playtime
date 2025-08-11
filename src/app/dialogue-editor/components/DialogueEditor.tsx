"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import CreateDialogueModal from "./CreateDialogueModal";
import { getCharacterIcon } from "@/constants/characterInformation";
import { Play, Pause, PencilSimple } from "@phosphor-icons/react";
import { useDialogueStore } from "@/stores/dialogueStore";

interface DialogueNode {
  id: string;
  type: "DIALOGUE" | "OPTION" | "EVENT" | "CONDITION";
  position: { x: number; y: number };
  data: {
    text?: string;
    expression?: string;
    [key: string]: unknown;
  };
}

interface DialogueTree {
  id: string;
  title: string;
  characterName: string;
  nodes: DialogueNode[];
  connections: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    [key: string]: unknown;
  }>;
  metadata: {
    description?: string;
    tags?: string[];
    createdAt?: string;
    [key: string]: unknown;
  };
}

export default function DialogueEditor() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dialogueTrees, setDialogueTrees] = useState<DialogueTree[]>([]);
  const [selectedTree, setSelectedTree] = useState<DialogueTree | null>(null);

  // Form state for editing existing trees
  const [editingTree, setEditingTree] = useState<DialogueTree | null>(null);

  // Playtest state
  const [isPlaytesting, setIsPlaytesting] = useState(false);

  // Playtest functionality
  const { openDialogue, closeDialogue } = useDialogueStore();

  const handlePlaytest = () => {
    if (!selectedTree) {
      return;
    }

    // Convert the first dialogue node to dialogue data
    const startNode = selectedTree.nodes.find((node) => node.id === "start");

    if (startNode && startNode.type === "DIALOGUE") {
      const dialogueData = {
        character: {
          id: selectedTree.characterName,
          name: selectedTree.characterName,
          expression: (startNode.data.expression as "happy" | "nervous" | "sad" | "angry" | "neutral") || "happy",
        },
        text: startNode.data.text || "Hello!",
        options: [
          {
            id: "continue",
            text: "Continue...",
            onSelect: () => {
              // For now, just close the dialogue
              // Later we can implement full dialogue tree traversal
              closeDialogue();
            },
          },
        ],
      };

      openDialogue(dialogueData);
      setIsPlaytesting(true);
    }
  };

  const handleStopPlaytest = () => {
    setIsPlaytesting(false);
    closeDialogue();
  };

  const handleCreateTree = useCallback(
    (treeData: { title: string; characterName: string; description: string }) => {
      const newTree: DialogueTree = {
        id: `tree_${Date.now()}`,
        title: treeData.title,
        characterName: treeData.characterName,
        nodes: [
          {
            id: "start",
            type: "DIALOGUE",
            position: { x: 0, y: 0 },
            data: {
              text: "Hello!",
              expression: "happy",
            },
          },
        ],
        connections: [],
        metadata: {
          description: treeData.description,
          createdAt: new Date().toISOString(),
        },
      };

      setDialogueTrees((prevTrees) => [...prevTrees, newTree]);
      setSelectedTree(newTree);
      setIsCreateModalOpen(false);
    },
    [] // No dependencies needed
  );

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleStartEditing = (tree: DialogueTree) => {
    setEditingTree({ ...tree });
    setSelectedTree(tree);
  };

  const handleSaveChanges = () => {
    if (editingTree && selectedTree) {
      const updatedTrees = dialogueTrees.map((tree) => (tree.id === selectedTree.id ? editingTree : tree));
      setDialogueTrees(updatedTrees);
      setSelectedTree(editingTree);
      setEditingTree(null);
    }
  };

  const handleCancelEditing = () => {
    setEditingTree(null);
  };

  // Keyboard shortcut for playtest toggle - moved here after function definitions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "p" && selectedTree) {
        e.preventDefault();
        if (isPlaytesting) {
          handleStopPlaytest();
        } else {
          handlePlaytest();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedTree, isPlaytesting, handlePlaytest, handleStopPlaytest]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dialogue Editor</h1>
          <p className="text-gray-600 mt-2">Create and manage character dialogue trees</p>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              Create New Dialogue Tree
            </Button>
            <Button variant="outline">Import JSON</Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Save All
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Dialogue Tree List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Dialogue Trees</h3>
              {dialogueTrees.length === 0 ? (
                <p className="text-gray-500 text-sm">No dialogue trees created yet.</p>
              ) : (
                <div className="space-y-2">
                  {dialogueTrees.map((tree) => (
                    <div
                      key={tree.id}
                      onClick={() => setSelectedTree(tree)}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedTree?.id === tree.id
                          ? "bg-blue-100 border border-blue-300"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCharacterIcon(tree.characterName)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{tree.title}</p>
                          <p className="text-sm text-gray-500 capitalize">{tree.characterName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-3">
            {selectedTree ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedTree.title}</h2>
                    <p className="text-gray-600">Character: {selectedTree.characterName}</p>
                    {isPlaytesting && (
                      <div className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium inline-flex items-center gap-2">
                        🎮 Playtest Mode Active
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!editingTree ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (isPlaytesting) {
                              handleStopPlaytest();
                            } else {
                              handlePlaytest();
                            }
                          }}
                          className={`${isPlaytesting ? "bg-green-100 border-green-300 text-green-700" : ""}`}
                        >
                          {isPlaytesting ? (
                            <>
                              <Pause size={16} />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play size={16} />
                              Play
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => handleStartEditing(selectedTree)}>
                          <PencilSimple size={16} />
                          Edit
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={handleCancelEditing}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveChanges} className="bg-blue-600 hover:bg-blue-700">
                          Save Changes
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Simple Node Editor for now */}
                <div className="space-y-4">
                  {selectedTree.nodes.map((node) => (
                    <div key={node.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-gray-700">Node: {node.id}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                          {node.type.toLowerCase()}
                        </span>
                      </div>

                      {node.type === "DIALOGUE" && (
                        <div className="space-y-3">
                          <Input
                            placeholder="Enter dialogue text..."
                            value={editingTree?.nodes.find((n) => n.id === node.id)?.data.text || node.data.text || ""}
                            onChange={(e) => {
                              if (editingTree) {
                                const updatedEditingTree = { ...editingTree };
                                const nodeIndex = updatedEditingTree.nodes.findIndex((n) => n.id === node.id);
                                if (nodeIndex !== -1) {
                                  updatedEditingTree.nodes[nodeIndex] = {
                                    ...updatedEditingTree.nodes[nodeIndex],
                                    data: {
                                      ...updatedEditingTree.nodes[nodeIndex].data,
                                      text: e.target.value,
                                    },
                                  };
                                }
                                setEditingTree(updatedEditingTree);
                              }
                            }}
                          />
                          <select
                            value={
                              editingTree?.nodes.find((n) => n.id === node.id)?.data.expression ||
                              node.data.expression ||
                              "happy"
                            }
                            onChange={(e) => {
                              if (editingTree) {
                                const updatedEditingTree = { ...editingTree };
                                const nodeIndex = updatedEditingTree.nodes.findIndex((n) => n.id === node.id);
                                if (nodeIndex !== -1) {
                                  updatedEditingTree.nodes[nodeIndex] = {
                                    ...updatedEditingTree.nodes[nodeIndex],
                                    data: {
                                      ...updatedEditingTree.nodes[nodeIndex].data,
                                      expression: e.target.value,
                                    },
                                  };
                                }
                                setEditingTree(updatedEditingTree);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="happy">Happy</option>
                            <option value="sad">Sad</option>
                            <option value="nervous">Nervous</option>
                            <option value="angry">Angry</option>
                            <option value="neutral">Neutral</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🎭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Dialogue Tree Selected</h3>
                <p className="text-gray-500">
                  Select a dialogue tree from the left panel or create a new one to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create New Tree Modal */}
      <CreateDialogueModal isOpen={isCreateModalOpen} onClose={handleCloseModal} onCreateTree={handleCreateTree} />
    </div>
  );
}
