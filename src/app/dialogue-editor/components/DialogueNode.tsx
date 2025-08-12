"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { X, Spinner } from "@phosphor-icons/react";

interface DialogueOption {
  id: string;
  text: string;
  targetNodeId: string;
}

interface DialogueNodeData {
  text?: string;
  expression?: string;
  options?: DialogueOption[];
  autoAdvance?: boolean;
  [key: string]: unknown;
}

interface DialogueNodeProps {
  node: {
    id: string;
    type: string;
    name: string;
    position: { x: number; y: number };
    data: DialogueNodeData;
  };
  index: number;
  isEditing: boolean;
  isSelected: boolean;
  isDragging: boolean;
  editingTree: any;
  selectedTree: any;
  onNodeSelect: (nodeId: string) => void;
  onDragStart: (e: React.DragEvent, nodeId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetNodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateNodeData: (nodeId: string, field: string, value: string) => void;
  onUpdateNodeName: (nodeId: string, name: string) => void;
  onChangeNodeType: (nodeId: string, newType: "DIALOGUE") => void;
  onAddOption: (nodeId: string) => void;
  onUpdateOptionText: (nodeId: string, optionId: string, text: string) => void;
  onUpdateOptionTarget: (nodeId: string, optionId: string, targetNodeId: string) => void;
  onDeleteOption: (nodeId: string, optionId: string) => void;
  onToggleAutoAdvance: (nodeId: string) => void;
  onAddNewNode: () => string; // Returns the ID of the new node
  deletingNodeId: string | null;
  inputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>;
  onTabNavigation: (e: React.KeyboardEvent, currentNodeId: string) => void;
}

export default function DialogueNode({
  node,
  index,
  isEditing,
  isSelected,
  isDragging,
  editingTree,
  selectedTree,
  onNodeSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDeleteNode,
  onUpdateNodeData,
  onUpdateNodeName,
  onChangeNodeType,
  onAddOption,
  onUpdateOptionText,
  onUpdateOptionTarget,
  onDeleteOption,
  onToggleAutoAdvance,
  onAddNewNode,
  deletingNodeId,
  inputRefs,
  onTabNavigation,
}: DialogueNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(node.name);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleNameClick = () => {
    if (isEditing) {
      setIsEditingName(true);
      setEditingName(node.name);
    }
  };

  const handleNameSave = () => {
    if (editingName.trim()) {
      onUpdateNodeName(node.id, editingName.trim());
    } else {
      setEditingName(node.name); // Reset to original if empty
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setEditingName(node.name);
      setIsEditingName(false);
    }
  };

  return (
    <div
      draggable={isEditing}
      onDragStart={(e) => onDragStart(e, node.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, node.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`border rounded-lg p-4 relative group cursor-move transition-all ${
        isSelected ? "border-blue-500 border-2 shadow-lg" : "border-gray-200 hover:border-gray-300"
      } ${isDragging ? "opacity-50" : ""}`}
      onClick={() => isEditing && onNodeSelect(node.id)}
    >
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3">
        {isEditingName ? (
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            className="text-sm font-medium text-gray-700 w-32"
            autoFocus
          />
        ) : (
          <span
            className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600 hover:underline"
            onClick={handleNameClick}
            title="Click to edit node name"
          >
            {node.name}
          </span>
        )}
        {isEditing ? (
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">{node.type.toLowerCase()}</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">{node.type.toLowerCase()}</span>
            {node.type === "DIALOGUE" && node.data.expression && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full capitalize">
                {node.data.expression}
              </span>
            )}
          </div>
        )}
        {isEditing && <span className="text-xs text-gray-500">(Tab to navigate, Shift+Tab for previous)</span>}
      </div>

      {/* Delete Node Button */}
      {isEditing && (
        <button
          onClick={() => onDeleteNode(node.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          title="Delete node"
          disabled={deletingNodeId === node.id}
        >
          {deletingNodeId === node.id ? <Spinner size={16} className="animate-spin" /> : <X size={16} />}
        </button>
      )}

      {/* Node Content */}
      {
        <div className="space-y-3">
          {/* Dialogue Text */}
          {isEditing ? (
            <Input
              ref={(el) => {
                inputRefs.current[`${node.id}_text`] = el;
              }}
              placeholder="Enter dialogue text..."
              value={editingTree.nodes.find((n: any) => n.id === node.id)?.data.text || ""}
              onChange={(e) => onUpdateNodeData(node.id, "text", e.target.value)}
              onKeyDown={(e) => onTabNavigation(e, node.id)}
            />
          ) : (
            <p className="text-gray-700 font-medium">{node.data.text}</p>
          )}

          {/* Expression Selector */}
          {isEditing && (
            <Select
              value={editingTree.nodes.find((n: any) => n.id === node.id)?.data.expression || "neutral"}
              onChange={(value) => onUpdateNodeData(node.id, "expression", value)}
              options={[
                { value: "happy", label: "Happy" },
                { value: "sad", label: "Sad" },
                { value: "nervous", label: "Nervous" },
                { value: "angry", label: "Angry" },
                { value: "neutral", label: "Neutral" },
              ]}
              placeholder="Select expression"
              searchable={true}
            />
          )}

          {/* Options Management */}
          <div className="space-y-3 mt-6">
            {/* Auto-advance checkbox */}
            {isEditing && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Options</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingTree.nodes.find((n: any) => n.id === node.id)?.data.autoAdvance || false}
                    onChange={() => onToggleAutoAdvance(node.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Auto-advance all options</span>
                </div>
              </div>
            )}

            {/* Options List */}
            {(isEditing ? editingTree.nodes.find((n: any) => n.id === node.id)?.data.options : node.data.options)?.map(
              (option: DialogueOption, optionIndex: number) => (
                <div key={option.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 w-6">{optionIndex + 1}</span>
                  {isEditing ? (
                    <>
                      <Input
                        placeholder="Option text..."
                        value={option.text}
                        onChange={(e) => onUpdateOptionText(node.id, option.id, e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={option.targetNodeId}
                        onChange={(value) => {
                          if (value === "new") {
                            const newNodeId = onAddNewNode();
                            onUpdateOptionTarget(node.id, option.id, newNodeId);
                          } else {
                            onUpdateOptionTarget(node.id, option.id, value);
                          }
                        }}
                        options={[
                          ...editingTree.nodes
                            .filter((n: any) => n.id !== node.id && n.type === "DIALOGUE")
                            .map((n: any) => ({
                              value: n.id,
                              label: `${n.data.text?.substring(0, 30)}...`,
                            })),
                          { value: "new", label: "+ Create new node" },
                        ]}
                        placeholder="Target node"
                        searchable={true}
                      />
                      <button
                        onClick={() => onDeleteOption(node.id, option.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete option"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-700">{option.text}</span>
                      <span className="text-gray-600">
                        →{" "}
                        {selectedTree?.nodes
                          .find((n: any) => n.id === option.targetNodeId)
                          ?.data.text?.substring(0, 30) || "No target"}
                      </span>
                    </>
                  )}
                </div>
              )
            ) || []}

            {/* Add Option Button */}
            {isEditing && (
              <Button
                onClick={() => onAddOption(node.id)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
              >
                + Add Option
              </Button>
            )}
          </div>
        </div>
      }
    </div>
  );
}
