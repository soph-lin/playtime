"use client";

import { useState } from "react";
import CreateGameModal from "@/components/menu/CreateGameModal";

export default function GamePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create or Join a Game</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Game
          </button>
        </div>
      </div>

      <CreateGameModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
