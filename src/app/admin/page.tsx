"use client";

import { useState } from "react";
import Upload from "@/components/admin/Upload";
import SongReview from "@/components/admin/SongReview";
import SongLibrary from "@/components/admin/SongLibrary";
import PlaylistLibrary from "@/components/admin/PlaylistLibrary";
import CreatePlaylistModal from "@/components/playlist/CreatePlaylistModal";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "review" | "library" | "playlists">("upload");
  const [uploadType, setUploadType] = useState<"playlist" | "track">("playlist");
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [playlistRefreshKey, setPlaylistRefreshKey] = useState(0);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");

  const handlePlaylistCreated = () => {
    setPlaylistRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 rounded cursor-pointer ${
            activeTab === "upload" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Upload
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 rounded cursor-pointer ${
            activeTab === "review" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Review Songs
        </button>
        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2 rounded cursor-pointer ${
            activeTab === "library" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab("playlists")}
          className={`px-4 py-2 rounded cursor-pointer ${
            activeTab === "playlists" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Playlists
        </button>
      </div>

      {activeTab === "upload" ? (
        <div className="space-y-8">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setUploadType("playlist")}
              className={`px-4 py-2 rounded cursor-pointer ${
                uploadType === "playlist" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              Upload Playlist
            </button>
            <button
              onClick={() => setUploadType("track")}
              className={`px-4 py-2 rounded cursor-pointer ${
                uploadType === "track" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              Upload Track
            </button>
          </div>
          <Upload type={uploadType} service="spotify" />
        </div>
      ) : activeTab === "review" ? (
        <SongReview />
      ) : activeTab === "library" ? (
        <SongLibrary />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setIsCreatePlaylistModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create Playlist
            </button>
            <input
              type="text"
              placeholder="Search playlists..."
              value={playlistSearchQuery}
              onChange={(e) => setPlaylistSearchQuery(e.target.value)}
              className="px-4 py-2 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <PlaylistLibrary key={playlistRefreshKey} searchQuery={playlistSearchQuery} />
        </div>
      )}

      <CreatePlaylistModal
        isOpen={isCreatePlaylistModalOpen}
        onClose={() => setIsCreatePlaylistModalOpen(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </div>
  );
}
