"use client";

import { useRef, useState, useEffect } from "react";
import { Check } from "@phosphor-icons/react";
import Modal from "../ui/Modal";
import Dropdown from "../ui/Dropdown";
import { Song } from "@prisma/client";

interface GuessModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onGuess: (song: Song) => void;
  attempts: number;
}

export default function GuessModal({ isOpen, onClose, songs, onGuess, attempts }: GuessModalProps) {
  const dropdownRef = useRef<{ focus: () => void }>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      setTimeout(() => {
        dropdownRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    const song = songs.find((s) => s.title === option);
    if (song) {
      setSelectedSong(song);
    }
  };

  const handleSubmit = () => {
    if (selectedSong) {
      onGuess(selectedSong);
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && selectedSong) {
      handleSubmit();
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, selectedSong]);

  return (
    <Modal title="Make Your Guess" isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl overflow-visible">
      <div className="space-y-6 p-4">
        <div className="relative z-50 flex items-center gap-2">
          <Dropdown
            ref={dropdownRef}
            options={songs.map((song) => song.title)}
            onSelect={handleSelect}
            placeholder="Select a song..."
            value={selectedSong?.title || null}
            className="flex-1"
          />
          <button
            onClick={handleSubmit}
            disabled={!selectedSong}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-md"
            title="Press Enter to submit"
          >
            <Check className="w-6 h-6" />
          </button>
        </div>
        <div className="text-center">
          <p className="text-lg text-gray-600">{attempts > 0 ? `Attempts: ${attempts}` : "First try!"}</p>
        </div>
      </div>
    </Modal>
  );
}
