"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Playlist } from "@prisma/client";

interface DeletePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteSongs: boolean) => void;
  playlist: Playlist | null;
  isDeleting: boolean;
  songCount?: number;
}

export default function DeletePlaylistModal({
  isOpen,
  onClose,
  onConfirm,
  playlist,
  isDeleting,
  songCount = 0,
}: DeletePlaylistModalProps) {
  const [deleteSongs, setDeleteSongs] = useState(false);

  if (!playlist) return null;

  const handleConfirm = () => {
    onConfirm(deleteSongs);
  };

  return (
    <Modal title="Delete Playlist" isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="text-center space-y-4">
        <div className="text-gray-700">
          <p>Are you sure you want to delete this playlist?</p>
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-medium text-red-900">{playlist.name}</p>
            {songCount > 0 && (
              <p className="text-sm text-red-700">
                {songCount} song{songCount !== 1 ? "s" : ""} in playlist
              </p>
            )}
          </div>

          {songCount > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteSongs}
                  onChange={(e) => setDeleteSongs(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                />
                <span className="text-sm text-yellow-800">
                  Also delete {songCount} song{songCount !== 1 ? "s" : ""} in this playlist
                </span>
              </label>
              <p className="text-xs text-yellow-700 mt-1">
                Songs will only be deleted if they are not used in other playlists
              </p>
            </div>
          )}

          <p className="mt-3 text-sm text-gray-600">
            This action cannot be undone. The playlist will be permanently removed.
            {deleteSongs && songCount > 0 && (
              <span className="block mt-1 font-medium text-red-600">Songs will also be permanently deleted!</span>
            )}
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
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isDeleting ? "Deleting..." : "Delete Playlist"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
