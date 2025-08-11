"use client";

import React, { useState } from "react";
import DialogueStage from "@/components/dialogue/DialogueStage";
import "@/components/dialogue/dialogue-animations.css";

export default function DialogueEditorPage() {
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<"happy" | "nervous" | "sad" | "angry" | "neutral">(
    "neutral"
  );
  const [blurBackground, setBlurBackground] = useState(true);

  const testOptions = [
    {
      id: "greeting",
      text: "Hello! Nice to meet you!",
      onSelect: () => {
        setCurrentExpression("happy");
        console.log("Selected: Hello!");
      },
    },
    {
      id: "question",
      text: "What do you do around here?",
      onSelect: () => {
        setCurrentExpression("neutral");
        console.log("Selected: What do you do?");
      },
    },
    {
      id: "concern",
      text: "Are you okay?",
      onSelect: () => {
        setCurrentExpression("sad");
        console.log("Selected: Are you okay?");
      },
    },
    {
      id: "goodbye",
      text: "Goodbye!",
      onSelect: () => {
        setIsDialogueOpen(false);
        console.log("Selected: Goodbye!");
      },
    },
  ];

  const handleOpenDialogue = () => {
    setIsDialogueOpen(true);
    setCurrentExpression("neutral");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Dialogue Editor</h1>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Test & Edit Dialogue</h2>

          <div className="space-y-4">
            <p className="text-gray-600">
              This page demonstrates the basic dialogue system and will become the visual dialogue editor. Currently
              showing character sprites, expressions, and interactive options.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleOpenDialogue}
                className="px-6 py-3 bg-cerulean text-white rounded-lg hover:bg-cerulean/90 transition-colors duration-200"
              >
                Open Dialogue
              </button>

              <button
                onClick={() => setCurrentExpression("happy")}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
              >
                Happy
              </button>

              <button
                onClick={() => setCurrentExpression("nervous")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Nervous
              </button>

              <button
                onClick={() => setCurrentExpression("sad")}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Sad
              </button>

              <button
                onClick={() => setCurrentExpression("angry")}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Angry
              </button>
            </div>

            {/* Background Blur Toggle */}
            <div className="flex items-center gap-3 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blurBackground}
                  onChange={(e) => setBlurBackground(e.target.checked)}
                  className="w-4 h-4 text-cerulean rounded focus:ring-cerulean"
                />
                <span className="text-gray-700">Blur background</span>
              </label>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Current Expression:</h3>
              <p className="text-gray-600 capitalize">{currentExpression}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue Stage */}
      <DialogueStage
        isOpen={isDialogueOpen}
        onClose={() => setIsDialogueOpen(false)}
        character={{
          id: "blues",
          name: "Blues",
          expression: currentExpression,
        }}
        text="Hey there! I'm Blues. Nice to meet you! I love playing music and making new friends. How are you doing today?"
        options={testOptions}
        blurBackground={blurBackground}
      />
    </div>
  );
}
