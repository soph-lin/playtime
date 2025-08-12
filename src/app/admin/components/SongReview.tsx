"use client";

import { useState, useEffect } from "react";
import SongLibraryItem from "./SongLibraryItem";
import { Song } from "@prisma/client";
import LoadingSpinner from "@/components/effects/LoadingSpinner";
import { getAllSongs } from "@/services/songService";
import Modal from "@/components/ui/Modal";
import { toast } from "react-hot-toast";

export default function SongReview() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const data = await getAllSongs("pending");
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch songs");
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const approveAllSongs = async () => {
    setIsApprovingAll(true);
    try {
      const approvePromises = songs.map((song) =>
        fetch(`/api/songs`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            songId: song.id,
            action: "approve",
            soundcloudData: {
              id: song.soundcloudId || song.spotifyId,
              permalinkUrl: song.permalinkUrl || `https://open.spotify.com/track/${song.spotifyId}`,
              duration: song.duration || 0,
            },
          }),
        })
      );

      await Promise.all(approvePromises);

      // Refresh the songs list
      await fetchSongs();

      toast.success(`Successfully approved ${songs.length} songs!`);
    } catch (err) {
      console.error("Error approving all songs:", err);
      toast.error("Failed to approve all songs. Please try again.");
    } finally {
      setIsApprovingAll(false);
      setIsConfirmModalOpen(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {songs.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900">
                {songs.length} song{songs.length !== 1 ? "s" : ""} pending review
              </h3>
              <p className="text-sm text-blue-700 mt-1">Review each song individually or approve them all at once</p>
            </div>
            <button
              onClick={openConfirmModal}
              disabled={isApprovingAll}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isApprovingAll ? "Approving..." : `Approve All (${songs.length})`}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {songs.length === 0 ? (
          <div className="text-center text-gray-500">Wow, such empty</div>
        ) : (
          songs.map((song) => <SongLibraryItem key={song.id} song={song} editable={true} refreshSongs={fetchSongs} />)
        )}
      </div>

      <Modal
        title="Approve All Songs"
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        className="max-w-md"
      >
        <div className="text-center space-y-4">
          <div className="text-gray-700">
            <p>Are you sure you want to approve all pending songs?</p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-900">{songs.length} songs will be approved</p>
              <p className="text-sm text-blue-700 mt-1">
                This will move all songs from pending review to the approved library
              </p>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              This action cannot be undone. All songs will be immediately available for use in games.
            </p>
          </div>

          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isApprovingAll}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={approveAllSongs}
              disabled={isApprovingAll}
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isApprovingAll ? "Approving..." : "Approve All Songs"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
