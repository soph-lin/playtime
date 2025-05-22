"use client";

import { useState, useRef, useEffect } from "react";
import UploadHistory, { HistoryEntry } from "./UploadHistory";
import { UploadResponse } from "@/services/upload/types";
import { cn } from "@/lib/utils";

interface UploadProps {
  type: "track" | "playlist";
  service: "spotify" | "soundcloud";
}

export default function Upload({ type, service }: UploadProps) {
  const [trackUrl, setTrackUrl] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [visibleHistory, setVisibleHistory] = useState<HistoryEntry[]>([]);

  const currentUrl = type === "track" ? trackUrl : playlistUrl;
  const setCurrentUrl = type === "track" ? setTrackUrl : setPlaylistUrl;

  // Add effect to handle sequential animations
  useEffect(() => {
    if (history.length > visibleHistory.length) {
      const timer = setTimeout(() => {
        setVisibleHistory((prev) => [...prev, history[visibleHistory.length]]);
      }, 300); // 300ms delay between each item
      return () => clearTimeout(timer);
    }
  }, [history, visibleHistory]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUrl) return;

    setIsUploading(true);
    setHistory([]);
    setVisibleHistory([]);

    // Add initial processing message
    setHistory((prev) => [
      ...prev,
      {
        id: `initial-${Date.now()}`,
        title: "Upload Started",
        artist: "",
        status: type === "track" ? "uploading_track" : "uploading_playlist",
        message: type === "track" ? "Uploading track..." : "Uploading playlist...",
        error: undefined,
        timestamp: new Date().toISOString(),
      } as HistoryEntry,
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: currentUrl,
          type,
          service: "spotify",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let playlistName: string | undefined;
      let totalSongs = 0;
      let uploadedSongs = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const data = JSON.parse(chunk) as UploadResponse;

        // Update playlist name if available
        if (type === "playlist" && data.playlistName) {
          playlistName = data.playlistName;
          totalSongs = data.progress.total;
          setHistory((prev) => [
            {
              id: prev[0].id,
              title: "Upload Started",
              artist: "",
              status: "uploading_playlist",
              message: `Uploading playlist "${playlistName}"...`,
              error: undefined,
              timestamp: prev[0].timestamp,
            } as HistoryEntry,
            ...prev.slice(1),
          ]);
        }

        // Count successful uploads from this chunk
        const successfulInChunk = data.songs.filter((song) => song.status === "success").length;
        uploadedSongs += successfulInChunk;

        // Update history with song statuses
        setHistory((prev) => [
          ...prev,
          ...data.songs.map((song) => {
            const timestamp = new Date().toISOString();
            const status =
              song.status === "success"
                ? "song_added"
                : song.status === "failed"
                  ? "song_failed"
                  : song.status === "already_added"
                    ? "already_added"
                    : type === "track"
                      ? "uploading_track"
                      : "uploading_playlist";

            const message =
              song.status === "success"
                ? `Added '${song.title}' by ${song.artist}`
                : song.status === "failed"
                  ? `Failed to add '${song.title}' by ${song.artist}`
                  : song.status === "already_added"
                    ? `'${song.title}' by ${song.artist} already exists`
                    : type === "track"
                      ? `Uploading track '${song.title}' by ${song.artist}...`
                      : `Uploading playlist track '${song.title}' by ${song.artist}...`;

            return {
              id: `${song.id}-${timestamp}`,
              title: song.title,
              artist: song.artist,
              status,
              message,
              error: song.error,
              timestamp,
            } as HistoryEntry;
          }),
        ]);
      }

      // Update initial message with final counts
      const finalMessage =
        type === "track"
          ? "Uploaded track"
          : `Uploaded playlist "${playlistName}" (${uploadedSongs}/${totalSongs} songs)`;

      setHistory((prev) => {
        const initialEntry = prev[0];
        if (initialEntry) {
          return [
            {
              ...initialEntry,
              status: "song_added",
              message: finalMessage,
            },
            ...prev.slice(1),
          ];
        }
        return prev;
      });

      // Wait for all items to be visible before updating the final message
      const finalMessageDelay = (history.length + 1) * 300; // Wait for all items + buffer
      setTimeout(() => {
        setVisibleHistory((prev) => {
          const initialEntry = prev[0];
          if (initialEntry) {
            return [
              {
                ...initialEntry,
                status: "song_added",
                message: finalMessage,
              },
              ...prev.slice(1),
            ];
          }
          return prev;
        });
      }, finalMessageDelay);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Don't add a new history entry for cancellation, just update the last one
        setHistory((prev) => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastEntry,
                status: "song_failed" as const,
                message: "Upload cancelled by user",
                error: undefined,
              },
            ];
          }
          return prev;
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to upload";
        setHistory((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            title: "Upload Error",
            artist: "",
            status: "song_failed" as const,
            message: errorMessage,
            error: {
              step: "database" as const,
              message: errorMessage,
            },
            timestamp: new Date().toISOString(),
          } as HistoryEntry,
        ]);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleQuit = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUploading(false);
    }
  };

  const getPlaceholder = () => {
    if (service === "spotify") {
      return type === "track" ? "https://open.spotify.com/track/..." : "https://open.spotify.com/playlist/...";
    }
    return type === "track" ? "https://soundcloud.com/..." : "https://soundcloud.com/.../sets/...";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-2xl font-semibold mb-4">
            Upload {type.charAt(0).toUpperCase() + type.slice(1)} from{" "}
            {service.charAt(0).toUpperCase() + service.slice(1)}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && currentUrl && !isUploading) {
                    handleUpload(e);
                  }
                }}
                placeholder={getPlaceholder()}
                className="flex-1 p-2 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                disabled={isUploading}
              />
              <button
                onClick={isUploading ? handleQuit : handleUpload}
                disabled={!currentUrl}
                className={cn(
                  "px-4 py-2 text-white rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                  isUploading ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                )}
              >
                {isUploading ? "Quit" : "Upload"}
              </button>
            </div>

            <UploadHistory entries={visibleHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
