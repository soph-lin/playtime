"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import CreateDialogueModal from "./CreateDialogueModal";
import DialogueNode from "./DialogueNode";
import { getCharacterIcon } from "@/constants/characterInformation";
import { Play, Pause, PencilSimple, Spinner, X } from "@phosphor-icons/react";
import { useDialogueStore, type DialogueData } from "@/stores/dialogueStore";

interface DialogueNode {
  id: string;
  type: "DIALOGUE";
  name: string;
  position: { x: number; y: number };
  data: {
    text?: string;
    expression?: string;
    options?: Array<{
      id: string;
      text: string;
      targetNodeId: string;
    }>;
    autoAdvance?: boolean; // When true, all options go to next node
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

// Keyboard shortcuts mapping
const SHORTCUTS = {
  a: "add node",
  d: "delete node",
  c: "duplicate node",
  esc: "deselect node",
  e: "toggle edit mode",
  s: "save changes",
  p: "toggle play",
} as const;

export default function DialogueEditor() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dialogueTrees, setDialogueTrees] = useState<DialogueTree[]>([]);
  const [selectedTree, setSelectedTree] = useState<DialogueTree | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Form state for editing existing trees
  const [editingTree, setEditingTree] = useState<DialogueTree | null>(null);

  // Playtest state
  const [isPlaytesting, setIsPlaytesting] = useState(false);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  const [deletingTreeId, setDeletingTreeId] = useState<string | null>(null);

  // Refs for input focus detection
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

  // Load existing dialogues from database
  useEffect(() => {
    const fetchDialogueTrees = async () => {
      try {
        const response = await fetch("/api/dialogue");
        if (response.ok) {
          const data = await response.json();
          setDialogueTrees(data);
        } else {
          console.error("Failed to fetch dialogues");
        }
      } catch (error) {
        console.error("Error fetching dialogues:", error);
      }
    };

    fetchDialogueTrees();
  }, []);

  // Playtest functionality
  const handlePlaytest = useCallback(() => {
    const treeToPlay = editingTree || selectedTree;
    if (treeToPlay) {
      setIsPlaytesting(true);
      const startNode = treeToPlay.nodes[0];
      if (startNode && startNode.type === "DIALOGUE") {
        const dialogue: DialogueData = {
          character: {
            id: treeToPlay.characterName,
            name: treeToPlay.characterName,
            expression: (startNode.data.expression as "happy" | "nervous" | "sad" | "angry" | "neutral") || "neutral",
          },
          text: (startNode.data.text as string) || "Start of dialogue...",
          options: [
            {
              id: "continue",
              text: "Continue...",
              onSelect: () => useDialogueStore.getState().nextDialogue(),
            },
          ],
        };
        useDialogueStore.getState().openDialogue(dialogue, treeToPlay, () => {
          setIsPlaytesting(false);
        });
      }
    }
  }, [editingTree, selectedTree]);

  const handleStopPlaytest = useCallback(() => {
    setIsPlaytesting(false);
    useDialogueStore.getState().closeDialogue();
  }, []);

  const handleCreateTree = useCallback(
    async (treeData: { title: string; characterName: string; description: string }) => {
      try {
        const response = await fetch("/api/dialogue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(treeData),
        });

        if (response.ok) {
          const newTree = await response.json();
          setDialogueTrees((prevTrees) => [newTree, ...prevTrees]);
          setSelectedTree(newTree);
          setIsCreateModalOpen(false);
        } else {
          console.error("Failed to create dialogue");
        }
      } catch (error) {
        console.error("Error creating dialogue:", error);
      }
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleStartEditing = (tree: DialogueTree) => {
    setEditingTree({ ...tree });
    setSelectedTree(tree);
    // Select first node when starting to edit
    if (tree.nodes.length > 0) {
      setSelectedNodeId(tree.nodes[0].id);
    }
  };

  const handleSaveChanges = async () => {
    if (editingTree && selectedTree) {
      setIsSaving(true);
      try {
        const response = await fetch("/api/dialogue", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedTree.id,
            title: editingTree.title,
            characterName: editingTree.characterName,
            description: editingTree.metadata.description,
            nodes: editingTree.nodes,
            connections: editingTree.connections,
          }),
        });

        if (response.ok) {
          const updatedTree = await response.json();
          const updatedTrees = dialogueTrees.map((tree) => (tree.id === selectedTree.id ? updatedTree : tree));
          setDialogueTrees(updatedTrees);
          setSelectedTree(updatedTree);
          setEditingTree(null);
          setSelectedNodeId(null);
        } else {
          console.error("Failed to save changes");
        }
      } catch (error) {
        console.error("Error saving changes:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancelEditing = () => {
    setEditingTree(null);
    setSelectedNodeId(null);
  };

  const addNewNode = () => {
    if (!editingTree) return "";

    const newNodeId = `node_${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: "DIALOGUE" as const,
      name: `Node ${editingTree.nodes.length + 1}`,
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: {
        text: "New dialogue text",
        expression: "neutral" as const,
        options: [],
        autoAdvance: false,
      },
    };

    const updatedTree = {
      ...editingTree,
      nodes: [...editingTree.nodes, newNode],
    };

    setEditingTree(updatedTree);
    setSelectedNodeId(newNodeId);
    return newNodeId;
  };

  const addOptionToNode = (nodeId: string) => {
    if (!editingTree) return;

    const updatedNodes = editingTree.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              options: [
                ...(node.data.options || []),
                {
                  id: `option_${Date.now()}`,
                  text: "Option",
                  targetNodeId: "",
                },
              ],
            },
          }
        : node
    );

    setEditingTree({
      ...editingTree,
      nodes: updatedNodes,
    });
  };

  const updateOptionText = (nodeId: string, optionId: string, text: string) => {
    if (!editingTree) return;

    const updatedNodes = editingTree.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              options: (node.data.options || []).map((option) =>
                option.id === optionId ? { ...option, text } : option
              ),
            },
          }
        : node
    );

    setEditingTree({
      ...editingTree,
      nodes: updatedNodes,
    });
  };

  const updateOptionTarget = (nodeId: string, optionId: string, targetNodeId: string) => {
    if (!editingTree) return;

    const updatedNodes = editingTree.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              options: (node.data.options || []).map((option) =>
                option.id === optionId ? { ...option, targetNodeId } : option
              ),
            },
          }
        : node
    );

    setEditingTree({
      ...editingTree,
      nodes: updatedNodes,
    });
  };

  const deleteOption = (nodeId: string, optionId: string) => {
    if (!editingTree) return;

    const updatedNodes = editingTree.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              options: (node.data.options || []).filter((option) => option.id !== optionId),
            },
          }
        : node
    );

    setEditingTree({
      ...editingTree,
      nodes: updatedNodes,
    });
  };

  const toggleAutoAdvance = (nodeId: string) => {
    if (!editingTree) return;

    const updatedNodes = editingTree.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              autoAdvance: !node.data.autoAdvance,
            },
          }
        : node
    );

    setEditingTree({
      ...editingTree,
      nodes: updatedNodes,
    });
  };

  const duplicateNode = (nodeId: string) => {
    if (!editingTree) return;

    const nodeToDuplicate = editingTree.nodes.find((n) => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newNodeId = `node_${Date.now()}`;
    const newNode = {
      ...nodeToDuplicate,
      id: newNodeId,
      position: {
        x: nodeToDuplicate.position.x + 20,
        y: nodeToDuplicate.position.y + 20,
      },
    };

    // Insert after the duplicated node
    const nodeIndex = editingTree.nodes.findIndex((n) => n.id === nodeId);
    const updatedNodes = [...editingTree.nodes];
    updatedNodes.splice(nodeIndex + 1, 0, newNode);

    const updatedTree = {
      ...editingTree,
      nodes: updatedNodes,
    };

    setEditingTree(updatedTree);
    setSelectedNodeId(newNodeId);
  };

  const updateNodeData = (nodeId: string, field: string, value: string) => {
    if (!editingTree) return;

    const updatedNodes = editingTree.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              [field]: value,
            },
          }
        : node
    );

    setEditingTree({
      ...editingTree,
      nodes: updatedNodes,
    });
  };

  const updateNodeName = (nodeId: string, name: string) => {
    if (!editingTree) return;

    const updatedNodes = editingTree.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            name,
          }
        : node
    );

    setEditingTree({
      ...editingTree,
      nodes: updatedNodes,
    });
  };

  const deleteNode = (nodeId: string) => {
    if (!editingTree) return;

    setDeletingNodeId(nodeId);

    // Simulate a small delay for better UX
    setTimeout(() => {
      // Remove the node
      const updatedNodes = editingTree.nodes.filter((node) => node.id !== nodeId);

      // Remove connections that reference this node
      const updatedConnections = editingTree.connections.filter(
        (connection) => connection.fromNodeId !== nodeId && connection.toNodeId !== nodeId
      );

      const updatedTree = {
        ...editingTree,
        nodes: updatedNodes,
        connections: updatedConnections,
      };

      setEditingTree(updatedTree);

      // Clear selection if deleted node was selected
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(updatedNodes.length > 0 ? updatedNodes[0].id : null);
      }

      setDeletingNodeId(null);
    }, 300);
  };

  const deleteDialogueTree = async (treeId: string) => {
    setDeletingTreeId(treeId);

    try {
      const response = await fetch(`/api/dialogue/${treeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from local state
        setDialogueTrees((prevTrees) => prevTrees.filter((tree) => tree.id !== treeId));

        // If the deleted tree was selected, clear selection
        if (selectedTree?.id === treeId) {
          setSelectedTree(null);
          setEditingTree(null);
          setSelectedNodeId(null);
        }
      } else {
        console.error("Failed to delete dialogue");
      }
    } catch (error) {
      console.error("Error deleting dialogue:", error);
    } finally {
      setDeletingTreeId(null);
    }
  };

  // Handle node selection with tab navigation
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleTabNavigation = (e: React.KeyboardEvent, currentNodeId: string) => {
    // Only handle Tab key events
    if (e.key !== "Tab") return;

    if (!editingTree) return;

    const currentIndex = editingTree.nodes.findIndex((n) => n.id === currentNodeId);
    if (currentIndex === -1) return;

    let nextIndex: number;
    if (e.shiftKey) {
      // Shift+Tab: go to previous node
      nextIndex = currentIndex > 0 ? currentIndex - 1 : editingTree.nodes.length - 1;
    } else {
      // Tab: go to next node
      nextIndex = currentIndex < editingTree.nodes.length - 1 ? currentIndex + 1 : 0;
    }

    const nextNode = editingTree.nodes[nextIndex];
    if (nextNode) {
      setSelectedNodeId(nextNode.id);
      // Focus the first input in the next node
      setTimeout(() => {
        const nextInput = inputRefs.current[`${nextNode.id}_text`];
        if (nextInput) {
          nextInput.focus();
        }
      }, 0);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault();

    if (!draggedNodeId || !editingTree || draggedNodeId === targetNodeId) return;

    const draggedIndex = editingTree.nodes.findIndex((n) => n.id === draggedNodeId);
    const targetIndex = editingTree.nodes.findIndex((n) => n.id === targetNodeId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const updatedNodes = [...editingTree.nodes];
    const [draggedNode] = updatedNodes.splice(draggedIndex, 1);
    updatedNodes.splice(targetIndex, 0, draggedNode);

    setEditingTree({
      ...editingTree,
      nodes: updatedNodes,
    });

    setDraggedNodeId(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT";

      const key = e.key;

      // Handle ESC key even when inputs are focused (for deselecting nodes)
      if (key === "Escape" && selectedNodeId) {
        // First, check if any Select dropdown is open and close it
        const openSelects = document.querySelectorAll('[data-select-open="true"]');
        if (openSelects.length > 0) {
          // Close the first open select dropdown
          const firstOpenSelect = openSelects[0] as HTMLElement;
          const closeEvent = new Event("click", { bubbles: true });
          firstOpenSelect.dispatchEvent(closeEvent);
          console.log("Select dropdown closed via ESC");
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        setSelectedNodeId(null);

        // Also defocus any active input field
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
          (activeElement as HTMLElement).blur();
        }

        console.log("Node deselected via ESC and input defocused");
        return;
      }

      // Don't trigger other shortcuts if typing in an input
      if (isInputFocused) return;

      // Debug logging
      console.log("Key pressed:", key, "selectedNodeId:", selectedNodeId);

      switch (key) {
        case "p":
        case "P":
          if (selectedTree) {
            e.preventDefault();
            if (isPlaytesting) {
              handleStopPlaytest();
            } else {
              handlePlaytest();
            }
          }
          break;
        case "a":
        case "A":
          if (editingTree) {
            e.preventDefault();
            addNewNode();
          }
          break;
        case "d":
        case "D":
          if (editingTree && selectedNodeId) {
            e.preventDefault();
            deleteNode(selectedNodeId);
          }
          break;
        case "c":
        case "C":
          if (editingTree && selectedNodeId) {
            e.preventDefault();
            duplicateNode(selectedNodeId);
          }
          break;
        case "e":
        case "E":
          if (selectedTree) {
            e.preventDefault();
            if (editingTree) {
              // If already editing, cancel editing
              handleCancelEditing();
            } else {
              // If not editing, start editing
              handleStartEditing(selectedTree);
            }
          }
          break;
        case "s":
        case "S":
          if (editingTree && selectedTree) {
            e.preventDefault();
            handleSaveChanges();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTree, isPlaytesting, editingTree, selectedNodeId, handlePlaytest, handleStopPlaytest]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dialogue Editor</h1>
          <p className="text-gray-600 mt-2">Create and manage character dialogues</p>

          {/* Keyboard shortcuts description */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-wrap gap-2 text-sm text-blue-700">
              {Object.entries(SHORTCUTS).map(([key, functionName]) => (
                <span key={key} className="flex items-center gap-1">
                  <div className="px-2 py-1 bg-white border border-blue-300 rounded shadow-sm font-mono text-xs font-medium">
                    {key}
                  </div>
                  <span>{functionName}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              Create New Dialogue
            </Button>
            <Button variant="outline">Import JSON</Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Dialogue List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Dialogues</h3>
              {dialogueTrees.length === 0 ? (
                <p className="text-gray-500 text-sm">No dialogues created yet.</p>
              ) : (
                <div className="space-y-2">
                  {dialogueTrees.map((tree) => (
                    <div
                      key={tree.id}
                      className={`p-3 rounded transition-colors relative group ${
                        selectedTree?.id === tree.id
                          ? "bg-blue-100 border border-blue-300"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedTree(tree)}>
                        <span className="text-lg">{getCharacterIcon(tree.characterName)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{tree.title}</p>
                          <p className="text-sm text-gray-500 capitalize">{tree.characterName}</p>
                        </div>
                      </div>

                      {/* Delete button - appears on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDialogueTree(tree.id);
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete dialogue"
                        disabled={deletingTreeId === tree.id}
                      >
                        {deletingTreeId === tree.id ? <Spinner size={16} className="animate-spin" /> : <X size={16} />}
                      </button>
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
                    <div className="flex items-center gap-3 mb-2">
                      {editingTree ? (
                        <Input
                          placeholder="Dialogue title..."
                          value={editingTree.title}
                          onChange={(e) => setEditingTree({ ...editingTree, title: e.target.value })}
                          className="text-xl font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:border-none"
                        />
                      ) : (
                        <>
                          <h2 className="text-xl font-semibold text-gray-900">{selectedTree.title}</h2>
                          <span className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full capitalize">
                            {selectedTree.characterName}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Character Selection Below Header */}
                    {editingTree && (
                      <div className="flex items-center gap-3 mb-4">
                        <label className="text-sm font-medium text-gray-700 min-w-[80px]">Character</label>
                        <Select
                          value={editingTree.characterName}
                          onChange={(value) => setEditingTree({ ...editingTree, characterName: value })}
                          options={[
                            { value: "blues", label: "Blues" },
                            { value: "drum", label: "Drum" },
                            { value: "sitar", label: "Sitar" },
                            { value: "maracas", label: "Maracas" },
                            { value: "bongo-drum", label: "Bongo Drum" },
                            { value: "rock-guitar", label: "Rock Guitar" },
                            { value: "accordion", label: "Accordion" },
                          ]}
                          placeholder="Select character"
                          searchable={true}
                          className="w-48"
                        />
                      </div>
                    )}
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
                        <Button
                          onClick={handleSaveChanges}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Spinner size={16} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Node Editor */}
                <div className="space-y-4">
                  {/* Connection Visualization */}
                  {editingTree && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3">Connection Map</h4>
                      <div className="space-y-2">
                        {editingTree.nodes
                          .filter((node) => node.data.options && node.data.options.length > 0)
                          .flatMap((dialogueNode) =>
                            (dialogueNode.data.options || []).map((option) => {
                              const targetNode = editingTree.nodes.find((n) => n.id === option.targetNodeId);
                              return (
                                <div key={option.id} className="flex items-center gap-2 text-sm">
                                  <span className="text-blue-700">💬</span>
                                  <span className="font-medium text-blue-800">
                                    &ldquo;{dialogueNode.data.text?.substring(0, 20)}...&rdquo;
                                  </span>
                                  <span className="text-blue-600">→</span>
                                  <span className="text-blue-700">📋</span>
                                  <span className="font-medium text-blue-800">
                                    &ldquo;{option.text?.substring(0, 30)}...&rdquo;
                                  </span>
                                  <span className="text-blue-600">→</span>
                                  <span className="text-blue-700">💬</span>
                                  <span className="font-medium text-blue-800">
                                    {targetNode
                                      ? `&ldquo;${targetNode.data.text?.substring(0, 30)}...&rdquo;`
                                      : "No target"}
                                  </span>
                                  {!targetNode && <span className="text-red-600 text-xs">⚠️ Broken connection</span>}
                                </div>
                              );
                            })
                          )}
                        {editingTree.nodes.filter((node) => node.data.options && node.data.options.length > 0)
                          .length === 0 && <p className="text-blue-600 text-sm italic">No options created yet</p>}
                      </div>
                    </div>
                  )}

                  {(editingTree || selectedTree)?.nodes.map((node, index) => (
                    <DialogueNode
                      key={node.id}
                      node={node}
                      index={index}
                      isEditing={editingTree !== null}
                      isSelected={selectedNodeId === node.id}
                      isDragging={draggedNodeId === node.id}
                      editingTree={editingTree}
                      selectedTree={selectedTree}
                      onNodeSelect={handleNodeSelect}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDeleteNode={deleteNode}
                      onUpdateNodeData={updateNodeData}
                      onUpdateNodeName={updateNodeName}
                      onAddOption={addOptionToNode}
                      onUpdateOptionText={updateOptionText}
                      onUpdateOptionTarget={updateOptionTarget}
                      onDeleteOption={deleteOption}
                      onToggleAutoAdvance={toggleAutoAdvance}
                      onAddNewNode={addNewNode}
                      deletingNodeId={deletingNodeId}
                      inputRefs={inputRefs}
                      onTabNavigation={handleTabNavigation}
                    />
                  ))}

                  {editingTree && (
                    <div className="flex gap-2">
                      <Button onClick={addNewNode} className="bg-gray-200 hover:bg-gray-300 text-gray-700">
                        + Add Node
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🎭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Dialogue Selected</h3>
                <p className="text-gray-500">
                  Select a dialogue from the left panel or create a new one to get started.
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
