"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface CreateDialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTree: (treeData: {
    title: string;
    characterName: string;
    description: string;
    tags: string;
    difficulty: string;
  }) => void;
}

const CHARACTERS = [
  { id: "blues", name: "Blues", sprite: "🎵" },
  { id: "drum", name: "Drum", sprite: "🥁" },
  { id: "sitar", name: "Sitar", sprite: "🎸" },
  { id: "bongo-drum", name: "Bongo Drum", sprite: "🥁" },
  { id: "maracas", name: "Maracas", sprite: "🎵" },
  { id: "rock-guitar", name: "Rock Guitar", sprite: "🎸" },
  { id: "accordion", name: "Accordion", sprite: "🪗" },
];

export default function CreateDialogueModal({ isOpen, onClose, onCreateTree }: CreateDialogueModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    characterName: "",
    description: "",
    tags: "",
    difficulty: "easy",
  });

  const handleSubmit = () => {
    onCreateTree(formData);
    setFormData({ title: "", characterName: "", description: "", tags: "", difficulty: "easy" });
  };

  const handleClose = () => {
    setFormData({ title: "", characterName: "", description: "", tags: "", difficulty: "easy" });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Dialogue Tree">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input
            placeholder="e.g., Blues Tutorial, Drum Introduction"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Character</label>
          <select
            value={formData.characterName}
            onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a character...</option>
            {CHARACTERS.map((char) => (
              <option key={char.id} value={char.id}>
                {char.sprite} {char.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Input
            placeholder="Brief description of this dialogue tree..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
          <Input
            placeholder="tutorial, introduction, character"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.title || !formData.characterName}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create Tree
        </Button>
      </div>
    </Modal>
  );
}
