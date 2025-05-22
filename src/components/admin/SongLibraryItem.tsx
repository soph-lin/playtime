import { useState, useRef, useEffect, useCallback } from "react";
import { Check, X, Pencil } from "@phosphor-icons/react";
import { SoundCloudTrack } from "@/app/api/soundcloud/types";
import SoundCloudTrackDropdown from "./SoundCloudTrackDropdown";
import EditSongFieldsModal from "./EditSongFieldsModal";
import { Song } from "@prisma/client";
import SoundCloudPlayer from "../player/SoundCloudPlayer";
import LoadingSpinner from "../effects/LoadingSpinner";
import { SoundCloudWidget } from "@/types/soundcloud";

interface SongLibraryProps {
  song: Song;
  editable?: boolean;
  refreshSongs: () => void;
}

export default function SongLibrary({ song, editable = false, refreshSongs }: SongLibraryProps) {
  const [searchResults, setSearchResults] = useState<SoundCloudTrack[]>([]);
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const soundcloudData = song.soundcloudId
    ? {
        id: song.soundcloudId,
        title: song.title || "",
        permalinkUrl: song.permalinkUrl || "",
        artworkUrl: song.coverUrl || "",
      }
    : null;

  const [selectedTrack, setSelectedTrack] = useState<SoundCloudTrack | null>(soundcloudData);
  const [isSearching, setIsSearching] = useState(false);
  const [offset, setOffset] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const playerRef = useRef<SoundCloudWidget | null>(null);
  const limit = 3;
  const [trackDuration, setTrackDuration] = useState<number>(song.duration || 180000);

  // Format time in mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, []);

  // Clear interval when component updates and isPlaying changes
  useEffect(() => {
    if (!isPlaying && progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, [isPlaying]);

  const onApprove = async (songId: string, track: SoundCloudTrack) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/songs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          songId,
          action: "approve",
          soundcloudData: {
            ...track,
            duration: trackDuration,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve song");
      }

      setIsComplete(true);
      // Small delay to allow the fade-out animation to complete
      setTimeout(() => {
        refreshSongs();
      }, 300);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Failed to approve song");
      setIsLoading(false);
    }
  };

  const onDeny = async (songId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/songs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          songId,
          action: "deny",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to deny song");
      }

      setIsComplete(true);
      // Small delay to allow the fade-out animation to complete
      setTimeout(() => {
        refreshSongs();
      }, 300);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Failed to deny song");
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      setIsSearching(true);

      const searchQuery = query || song.title || "";

      // Use the API endpoint with pagination parameters
      const response = await fetch(
        `/api/soundcloud/search?q=${encodeURIComponent(searchQuery)}&offset=${offset}&limit=${limit}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", response.status, errorData);
        throw new Error(errorData.error || `Failed to search SoundCloud: ${response.status}`);
      }

      const data = await response.json();

      // If this is the first search and we have a selected track, include it in the results
      if (!hasSearched && selectedTrack) {
        // Check if the selected track is already in the results to avoid duplicates
        const selectedTrackId = selectedTrack.id;
        const isSelectedTrackInResults = data.tracks.some((track: SoundCloudTrack) => track.id === selectedTrackId);

        if (!isSelectedTrackInResults) {
          // Create a new array with the selected track at the beginning
          const newResults = [selectedTrack, ...data.tracks];
          // Ensure all track IDs are unique
          const uniqueResults = Array.from(new Map(newResults.map((track) => [track.id, track])).values());
          setSearchResults(uniqueResults);
        } else {
          setSearchResults(data.tracks);
        }
      } else {
        setSearchResults(data.tracks);
      }

      // Mark this song as searched
      setHasSearched(true);
    } catch (err) {
      console.error("Search error details:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    const newOffset = offset + limit;
    setOffset(newOffset);

    try {
      setIsSearching(true);
      const searchQuery = song.title || "";

      const response = await fetch(
        `/api/soundcloud/search?q=${encodeURIComponent(searchQuery)}&offset=${newOffset}&limit=${limit}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", response.status, errorData);
        throw new Error(errorData.error || `Failed to search SoundCloud: ${response.status}`);
      }

      const data = await response.json();

      // Append new results to existing ones
      setSearchResults((prev) => {
        // Combine previous and new results
        const combinedResults = [...prev, ...data.tracks];
        // Ensure all track IDs are unique
        const uniqueResults = Array.from(new Map(combinedResults.map((track) => [track.id, track])).values());
        return uniqueResults;
      });
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackSelect = (track: SoundCloudTrack) => {
    setSelectedTrack(track);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(false);
    pausedTimeRef.current = 0;

    // Unbind any existing events
    if (playerRef.current) {
      try {
        playerRef.current.unbind(window.SC.Widget.Events.READY);
      } catch (error) {
        console.error("Error unbinding from SoundCloud player events:", error);
      }
    }

    // Cancel any ongoing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  // Listen for player ready event when component mounts or track changes
  useEffect(() => {
    if (playerRef.current) {
      try {
        playerRef.current.bind(window.SC.Widget.Events.READY, () => {
          try {
            playerRef.current?.getCurrentSound((sound) => {
              if (sound && sound.duration > 0 && selectedTrack) {
                // Update the track duration with the real duration
                setTrackDuration(sound.duration);

                // Auto-update database if durations differ
                if (song.duration !== sound.duration) {
                  handleEditFields(sound.duration);
                }
              }
            });
          } catch (error) {
            console.error("Error getting duration from SoundCloud player:", error);
          }
        });
      } catch (error) {
        console.error("Error binding to SoundCloud player ready event:", error);
      }
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.unbind(window.SC.Widget.Events.READY);
        } catch (error) {
          console.error("Error unbinding from SoundCloud player ready event:", error);
        }
      }
    };
  }, [selectedTrack, song.duration]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    startTimeRef.current = Date.now();

    // Clear any existing interval first
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // Start progress update with a more frequent interval
    progressInterval.current = setInterval(() => {
      const duration = trackDuration; // Duration is in ms
      const now = Date.now();
      const elapsed = now - startTimeRef.current + pausedTimeRef.current;
      const progressPercent = Math.min((elapsed / duration) * 100, 100);

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setProgress(progressPercent);
        setCurrentTime(elapsed);
      });

      // Stop interval if we've reached 100%
      if (progressPercent >= 100) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
        setIsPlaying(false);
      }
    }, 20); // Update every 20ms for smoother progress
  }, [trackDuration]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);

    // Store the current elapsed time when pausing
    pausedTimeRef.current = currentTime;

    // Cancel the interval immediately
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // Unbind the finish event when pausing
    if (playerRef.current) {
      try {
        playerRef.current.unbind("finish");
      } catch (error) {
        console.error("Error unbinding from SoundCloud player finish event:", error);
      }
    }
  }, [currentTime]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedTrack) return;

      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const progressBarWidth = rect.width;
      const seekPercentage = (clickPosition / progressBarWidth) * 100;

      // Get the real duration from the player
      let realDuration = trackDuration;
      if (playerRef.current) {
        try {
          playerRef.current.getCurrentSound((sound) => {
            if (sound && sound.duration > 0) {
              realDuration = sound.duration;
            }
          });
        } catch (error) {
          console.error("Error getting duration from SoundCloud player:", error);
        }
      }

      // Calculate the new time based on the click position
      const newTime = (seekPercentage / 100) * realDuration;

      // Update the current time and progress
      setCurrentTime(newTime);
      setProgress(seekPercentage);

      // Update the paused time reference
      pausedTimeRef.current = newTime;

      // If we're playing, update the start time to account for the seek
      if (isPlaying) {
        startTimeRef.current = Date.now();
      }

      // If we have access to the SoundCloud player, seek to the position
      if (playerRef.current) {
        try {
          playerRef.current.seekTo(newTime);
        } catch (error) {
          console.error("Error seeking in SoundCloud player:", error);
        }
      }
    },
    [selectedTrack, isPlaying, trackDuration]
  );

  const handleEditFields = async (duration: number) => {
    try {
      const response = await fetch("/api/songs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          songId: song.id,
          action: "update",
          duration,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update song duration");
      }

      // Update the track duration
      setTrackDuration(duration);

      // Refresh the songs list
      refreshSongs();
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Failed to update song duration");
    }
  };

  return (
    <div
      className={`flex flex-col p-4 bg-white rounded-lg shadow hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300 ${isComplete ? "opacity-0" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {selectedTrack && (
            <div className="flex items-center space-x-2">
              <SoundCloudPlayer
                trackUrl={selectedTrack.permalinkUrl}
                onPlay={handlePlay}
                onPause={handlePause}
                playerRef={playerRef}
                showButton={true}
                buttonClassName="p-2"
              />
            </div>
          )}
          {song.coverUrl && <img src={song.coverUrl} alt={song.title} className="w-16 h-16 object-cover rounded" />}
          <div>
            <h3 className="font-medium">{song.title}</h3>
            <p className="text-sm text-gray-600">{song.artist}</p>
            {song.album && <p className="text-sm text-gray-500">{song.album}</p>}
          </div>
        </div>

        {editable && (
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsEditingFields(true)}
                  className="p-2 text-gray-500 hover:text-gray-600 cursor-pointer"
                  title="Edit Duration"
                >
                  <Pencil size={20} weight="bold" />
                </button>
                <SoundCloudTrackDropdown
                  tracks={searchResults}
                  onTrackSelect={handleTrackSelect}
                  onLoadMore={handleLoadMore}
                  selectedTrack={selectedTrack}
                  onOpen={() => {
                    if (!hasSearched) {
                      handleSearch(song.title);
                    }
                  }}
                  isSearching={isSearching}
                  limit={limit}
                />

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onApprove(song.id, selectedTrack!)}
                    className="p-2 text-white bg-green-500 rounded hover:bg-green-600 cursor-pointer"
                    title="Approve"
                    disabled={!selectedTrack}
                  >
                    <Check size={20} weight="bold" />
                  </button>
                  <button
                    onClick={() => onDeny(song.id)}
                    className="p-2 text-white bg-red-500 rounded hover:bg-red-600 cursor-pointer"
                    title="Deny"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress bar at the bottom of the card */}
      {selectedTrack && (
        <div className="w-full mt-4">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer" onClick={handleSeek}>
            <div className={`h-full ${isPlaying ? "bg-blue-500" : "bg-blue-300"}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(trackDuration)}</span>
          </div>
        </div>
      )}

      {isEditingFields && (
        <EditSongFieldsModal
          currentDuration={song.duration || 0}
          onSave={handleEditFields}
          onClose={() => setIsEditingFields(false)}
        />
      )}
    </div>
  );
}
