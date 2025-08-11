/*
Note that using the Modal component caused the input to unfocus every time it was edited,
so a custom modal is implemented instead.
Later fix could use Modal component, this is a quick fix.
*/

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import RippleText from "@/components/effects/RippleText";
import { CHARACTERS } from "@/constants/characterInformation";

interface CreateDialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTree: (treeData: { title: string; characterName: string; description: string }) => void;
}

export default function CreateDialogueModal({ isOpen, onClose, onCreateTree }: CreateDialogueModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    characterName: "",
    description: "",
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onCreateTree(formData);
    setFormData({ title: "", characterName: "", description: "" });
  };

  const handleClose = () => {
    setIsAnimating(false);
    // Small delay to allow animation to complete
    setTimeout(() => {
      setFormData({ title: "", characterName: "", description: "" });
      onClose();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - slightly grayed out like Modal.tsx */}
      <div className="absolute inset-0 bg-transparent transition-all duration-300 ease-in-out" onClick={handleClose} />

      {/* Modal Content */}
      <div
        className={`
          bg-white rounded-2xl border-2 border-cerulean box-shadow-lg p-8
          transition-all duration-300 ease-in-out overflow-hidden
          ${isAnimating ? "max-h-[600px] opacity-100 translate-y-0" : "max-h-0 opacity-0 translate-y-[-50%]"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <RippleText
          text="Create New Dialogue"
          className="text-[40px] font-bold text-outline-lg text-white mb-4 text-center"
          outline="cerulean"
        />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g., Blues Tutorial, Drum Introduction"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Character</label>
            <select
              value={formData.characterName}
              onChange={(e) => setFormData((prev) => ({ ...prev, characterName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a character...</option>
              {CHARACTERS.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.icon} {char.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="Brief description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
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
      </div>
    </div>
  );
}
