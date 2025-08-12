"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { X, Spinner, ArrowRight } from "@phosphor-icons/react";
import type { DialogueTree, DialogueNode } from "@/types/dialogue";

interface DialogueNodeProps {
  node: DialogueNode;
  index: number;
  isEditing: boolean;
  isSelected: boolean;
  isDragging: boolean;
  editingTree: DialogueTree | null;
  selectedTree: DialogueTree | null;
  onNodeSelect: (nodeId: string) => void;
  onDragStart: (e: React.DragEvent, nodeId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetNodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateNodeData: (nodeId: string, field: string, value: string) => void;
  onUpdateNodeName: (nodeId: string, name: string) => void;
  onAddOption: (nodeId: string) => void;
  onUpdateOptionText: (nodeId: string, optionId: string, text: string) => void;
  onUpdateOptionTarget: (nodeId: string, optionId: string, targetNodeId: string) => void;
  onDeleteOption: (nodeId: string, optionId: string) => void;
  onToggleAutoAdvance: (nodeId: string) => void;
  onAddNewNode: () => string; // Returns the ID of the new node
  findNextAvailableNodeNumber: () => number;
  getAvailableTargetNodes: (nodes: DialogueNode[], excludeNodeId: string) => Array<{ value: string; label: string }>;
  deletingNodeId: string | null;
  inputRefs: React.MutableRefObject<{
    [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  }>;
  onTabNavigation: (e: React.KeyboardEvent, currentNodeId: string) => void;
}

export default function DialogueNode({
  node,
  isEditing,
  isSelected,
  isDragging,
  editingTree,
  selectedTree,
  onNodeSelect,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onDeleteNode,
  onUpdateNodeData,
  onUpdateNodeName,
  onAddOption,
  onUpdateOptionText,
  onUpdateOptionTarget,
  onDeleteOption,
  onToggleAutoAdvance,
  onAddNewNode,
  findNextAvailableNodeNumber,
  getAvailableTargetNodes,
  deletingNodeId,
  inputRefs,
  onTabNavigation,
}: DialogueNodeProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(node.name);

  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {};

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
      // If name is empty, find next available node number and save
      const nextNumber = findNextAvailableNodeNumber();
      onUpdateNodeName(node.id, `Node ${nextNumber}`);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      // Reset to current name (not original) and exit edit mode
      setEditingName(node.name);
      setIsEditingName(false);
    }
  };

  return (
    <div
      draggable={isEditing}
      onDragStart={(e) => onDragStart(e, node.id)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, node.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`border rounded-lg p-4 relative group transition-all ${
        isSelected ? "border-blue-500 border-2 shadow-lg" : "border-gray-200 hover:border-gray-300"
      } ${isDragging ? "opacity-50" : ""}`}
      onClick={() => isEditing && onNodeSelect(node.id)}
    >
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3">
        {isEditingName ? (
          <div onMouseDown={(e) => e.stopPropagation()} onDragStart={(e) => e.preventDefault()}>
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()}
              onSelect={(e) => e.stopPropagation()}
              draggable={false}
              className="text-sm font-medium text-gray-700 w-32"
              autoFocus
              minLength={1}
            />
          </div>
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
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()}
              onMouseEnter={() => (document.body.style.cursor = "text")}
              onMouseLeave={() => (document.body.style.cursor = "default")}
            >
              <Textarea
                ref={(el) => {
                  inputRefs.current[`${node.id}_text`] = el;
                }}
                placeholder="Enter dialogue text..."
                value={(editingTree?.nodes.find((n) => n.id === node.id)?.data.text as string) || ""}
                onChange={(e) => onUpdateNodeData(node.id, "text", e.target.value)}
                onKeyDown={(e) => onTabNavigation(e, node.id)}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onDragStart={(e) => e.preventDefault()}
                onSelect={(e) => e.stopPropagation()}
                draggable={false}
                rows={3}
                style={{ userSelect: "text", pointerEvents: "auto" }}
              />
            </div>
          ) : (
            <p className="text-gray-700 font-medium">{node.data.text}</p>
          )}

          {/* Expression Selector */}
          {isEditing && (
            <Select
              value={(editingTree?.nodes.find((n) => n.id === node.id)?.data.expression as string) || "neutral"}
              onChange={(value) => onUpdateNodeData(node.id, "expression", value)}
              options={[
                { value: "neutral", label: "Neutral" },
                { value: "happy", label: "Happy" },
                { value: "sad", label: "Sad" },
                { value: "nervous", label: "Nervous" },
                { value: "angry", label: "Angry" },
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
                    checked={(editingTree?.nodes.find((n) => n.id === node.id)?.data.autoAdvance as boolean) || false}
                    onChange={() => onToggleAutoAdvance(node.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Auto-advance all options</span>
                </div>
              </div>
            )}

            {/* Options List */}
            {(isEditing
              ? (editingTree?.nodes.find((n) => n.id === node.id)?.data.options as Array<{
                  id: string;
                  text: string;
                  targetNodeId: string;
                }>)
              : node.data.options
            )?.map((option: { id: string; text: string; targetNodeId: string }, optionIndex: number) => (
              <div key={option.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 w-6">{optionIndex + 1}</span>
                {isEditing ? (
                  <>
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={(e) => e.preventDefault()}
                      className="flex-1"
                    >
                      <Textarea
                        placeholder="Option text..."
                        value={option.text}
                        onChange={(e) => onUpdateOptionText(node.id, option.id, e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        onSelect={(e) => e.stopPropagation()}
                        draggable={false}
                        className="w-full"
                        rows={2}
                        style={{ userSelect: "text", pointerEvents: "auto" }}
                      />
                    </div>
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
                      options={[...(editingTree ? getAvailableTargetNodes(editingTree.nodes, node.id) : [])]}
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
                    <span className="text-gray-600 flex items-center gap-1">
                      <ArrowRight size={16} />
                      {selectedTree?.nodes.find((n) => n.id === option.targetNodeId)?.name || "No target"}
                    </span>
                  </>
                )}
              </div>
            )) || []}

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
