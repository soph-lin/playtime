"use client";

import Modal from "../ui/Modal";
import { Song } from "@prisma/client";

interface DeleteSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  song: Song | null;
  isDeleting: boolean;
}

export default function DeleteSongModal({ isOpen, onClose, onConfirm, song, isDeleting }: DeleteSongModalProps) {
  if (!song) return null;

  return (
    <Modal title="Delete Song" isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="text-center space-y-4">
        <div className="text-gray-700">
          <p>Are you sure you want to delete this song?</p>
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-medium text-red-900">{song.title}</p>
            <p className="text-sm text-red-700">by {song.artist}</p>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            This action cannot be undone. The song will be permanently removed from the library.
          </p>
        </div>

        <div className="flex space-x-3 justify-center">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isDeleting ? "Deleting..." : "Delete Song"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
