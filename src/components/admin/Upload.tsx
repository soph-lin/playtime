"use client";

import { useState, useRef, useEffect } from "react";
import UploadHistory, { HistoryEntry } from "./UploadHistory";
import { StreamingUploadResponse } from "@/services/upload/types";
import { cn } from "@/lib/utils";

interface UploadProps {
  service: "spotify";
}

export default function Upload({ service }: UploadProps) {
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [visibleHistory, setVisibleHistory] = useState<HistoryEntry[]>([]);

  // Add effect to handle sequential animations
  useEffect(() => {
    if (history.length > visibleHistory.length) {
      const timer = setTimeout(() => {
        setVisibleHistory((prev) => [...prev, history[visibleHistory.length]]);
      }, 300); // 300ms delay between each item
      return () => clearTimeout(timer);
    }
  }, [history, visibleHistory]);

  // Detect if URL is a track, playlist, or album
  const detectUrlType = (url: string): "track" | "playlist" | "album" => {
    if (url.includes("/playlist/")) return "playlist";
    if (url.includes("/album/")) return "album";
    if (url.includes("/track/")) return "track";
    // Default to track if we can't determine
    return "track";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    const urlType = detectUrlType(url);
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
        status: urlType === "track" ? "uploading_track" : "uploading_playlist",
        message:
          urlType === "track"
            ? "Uploading track..."
            : urlType === "playlist"
              ? "Uploading playlist..."
              : "Uploading album...",
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
          url,
          type: urlType,
          service,
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
      let playlistCreated = false;
      let totalSongs = 0;
      let uploadedSongs = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamingUploadResponse;

              switch (data.type) {
                case "progress":
                  // Update playlist information if available
                  if (data.playlistName) {
                    playlistName = data.playlistName;
                    totalSongs = data.progress?.total || 0;
                  }
                  if (data.playlistCreated !== undefined) {
                    playlistCreated = data.playlistCreated;
                  }
                  break;

                case "processing":
                  // Add processing status for current track
                  if (data.track) {
                    const track = data.track;
                    setHistory((prev) => [
                      ...prev,
                      {
                        id: `processing-${track.id}-${Date.now()}`,
                        title: track.title,
                        artist: track.artist,
                        status: "uploading_track" as const,
                        message: `Processing '${track.title}' by ${track.artist}...`,
                        error: undefined,
                        timestamp: new Date().toISOString(),
                      } as HistoryEntry,
                    ]);
                  }
                  break;

                case "song_result":
                  // Update the processing entry with final result
                  if (data.song) {
                    const status =
                      data.song.status === "success"
                        ? "song_added"
                        : data.song.status === "failed"
                          ? "song_failed"
                          : data.song.status === "already_added"
                            ? "already_added"
                            : "uploading_track";

                    const message =
                      data.song.status === "success"
                        ? `Added '${data.song.title}' by ${data.song.artist}`
                        : data.song.status === "failed"
                          ? `Failed to add '${data.song.title}' by ${data.song.artist}`
                          : data.song.status === "already_added"
                            ? `'${data.song.title}' by ${data.song.artist} already exists`
                            : `Processing '${data.song.title}' by ${data.song.artist}...`;

                    // Update the processing entry
                    setHistory((prev) => {
                      const processingIndex = prev.findIndex((entry) =>
                        entry.id.includes(`processing-${data.song!.id}`)
                      );

                      if (processingIndex !== -1) {
                        const updated = [...prev];
                        updated[processingIndex] = {
                          ...updated[processingIndex],
                          status,
                          message,
                          error: data.song?.error,
                        };
                        return updated;
                      }

                      // If no processing entry found, add a new one
                      return [
                        ...prev,
                        {
                          id: `${data.song!.id}-${Date.now()}`,
                          title: data.song!.title,
                          artist: data.song!.artist,
                          status,
                          message,
                          error: data.song?.error,
                          timestamp: new Date().toISOString(),
                        } as HistoryEntry,
                      ];
                    });

                    // Count successful uploads
                    if (data.song.status === "success") {
                      uploadedSongs++;
                    }
                  }
                  break;

                case "complete":
                  // Update initial message with final counts and playlist info
                  if (data.message) {
                    setHistory((prev) => {
                      const initialEntry = prev[0];
                      if (initialEntry) {
                        return [
                          {
                            ...initialEntry,
                            status: "song_added",
                            message: data.message!,
                          },
                          ...prev.slice(1),
                        ];
                      }
                      return prev;
                    });
                  }
                  break;

                case "error":
                  // Handle error
                  if (data.error) {
                    setHistory((prev) => [
                      ...prev,
                      {
                        id: `error-${Date.now()}`,
                        title: "Upload Error",
                        artist: "",
                        status: "song_failed" as const,
                        message: data.error!,
                        error: {
                          step: "database" as const,
                          message: data.error!,
                        },
                        timestamp: new Date().toISOString(),
                      } as HistoryEntry,
                    ]);
                  }
                  break;
              }
            } catch (parseError) {
              console.error("Failed to parse streaming data:", parseError);
            }
          }
        }
      }
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-2xl font-semibold mb-4">Upload from Spotify</h2>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Paste any Spotify URL and the associated song(s) will be added to the library. For playlists and albums, a
              new playlist will be created and new songs will be downloaded to the library as well.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && url && !isUploading) {
                      handleUpload(e);
                    }
                  }}
                  placeholder={"https://open.spotify.com/..."}
                  className="w-full p-2 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  disabled={isUploading}
                />
              </div>
              <button
                onClick={isUploading ? handleQuit : handleUpload}
                disabled={!url}
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
