import { useState, useEffect, useRef, useCallback } from "react";
import { MagnifyingGlass, Play, Pause, Spinner } from "@phosphor-icons/react";
import { SoundCloudTrack } from "@/app/api/soundcloud/types";
import { SoundCloudWidget } from "@/types/soundcloud";
import SoundCloudPlayer from "../player/SoundCloudPlayer";
import ProgressBar from "../player/ProgressBar";

interface SoundCloudTrackDropdownProps {
  tracks: SoundCloudTrack[];
  onTrackSelect: (track: SoundCloudTrack) => void;
  onLoadMore: () => void;
  selectedTrack: SoundCloudTrack | null;
  onOpen?: () => void;
  isSearching?: boolean;
  limit?: number;
}

export default function SoundCloudTrackDropdown({
  tracks,
  onTrackSelect,
  onLoadMore,
  selectedTrack,
  onOpen,
  isSearching = false,
  limit = 3,
}: SoundCloudTrackDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<SoundCloudWidget | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Filter out duplicate tracks based on ID
  const uniqueTracks = tracks.reduce<SoundCloudTrack[]>((acc, track) => {
    const isDuplicate = acc.some((t) => t.id === track.id);
    if (!isDuplicate) {
      acc.push(track);
    }
    return acc;
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Check if track has finished playing
  useEffect(() => {
    if (isPlaying && progress >= 100) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      pausedTimeRef.current = 0;
    }
  }, [isPlaying, progress]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      onOpen?.();
    }
  };

  const handlePlayTrack = (e: React.MouseEvent, track: SoundCloudTrack) => {
    e.stopPropagation(); // Prevent the dropdown from closing
    console.log("handlePlayTrack called", { trackId: track.id, currentPlayingTrackId: playingTrackId, isPlaying });

    if (playingTrackId === track.id) {
      // If the same track is already playing, toggle play/pause
      if (isPlaying) {
        console.log("Pausing track", track.id);
        playerRef.current?.pause();
        setIsPlaying(false);
      } else {
        console.log("Resuming track", track.id);
        playerRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      // If a different track is playing, stop it and play the new one
      console.log("Switching to new track", track.id);
      setPlayingTrackId(track.id);
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);
      pausedTimeRef.current = 0;
    }
  };

  const handlePlay = useCallback(() => {
    console.log("handlePlay called");
    setIsPlaying(true);
    startTimeRef.current = Date.now();

    // Clear any existing interval first
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // Start progress update with a more frequent interval
    progressInterval.current = setInterval(() => {
      const track = playingTrackId ? uniqueTracks.find((t) => t.id === playingTrackId) : null;
      const duration = track?.duration || 180000;
      const isPreview = track?.access === "preview";
      const maxDuration = isPreview ? 30000 : duration; // Cap at 30s for preview tracks
      const now = Date.now();
      const elapsed = now - startTimeRef.current + pausedTimeRef.current;
      const progressPercent = Math.min((elapsed / maxDuration) * 100, 100);

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
        // Reset playing state when track ends
        setIsPlaying(false);
      }
    }, 20); // Update every 20ms for smoother progress
  }, [playingTrackId, uniqueTracks]);

  const handlePause = useCallback(() => {
    console.log("handlePause called");
    setIsPlaying(false);
    pausedTimeRef.current = currentTime;

    // Cancel the interval immediately
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, [currentTime]);

  const handleSeek = useCallback(
    (time: number) => {
      const track = playingTrackId ? uniqueTracks.find((t) => t.id === playingTrackId) : null;
      const duration = track?.duration || 180000;
      const isPreview = track?.access === "preview";
      const maxDuration = isPreview ? 30000 : duration; // Cap at 30s for preview tracks
      const newTime = Math.min(time, maxDuration);

      setCurrentTime(newTime);
      setProgress((newTime / maxDuration) * 100);
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
    [isPlaying, playingTrackId, uniqueTracks]
  );

  return (
    <div className="relative z-10" ref={dropdownRef}>
      <div className="flex items-center space-x-4">
        <button onClick={handleOpen} className="p-2 text-gray-500 hover:text-gray-600 cursor-pointer">
          <MagnifyingGlass size={24} weight="bold" />
        </button>
      </div>

      <div
        className={`absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-lg py-2 z-10 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex justify-center items-center py-4">
              <Spinner size={24} className="animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500">Searching...</span>
            </div>
          ) : uniqueTracks.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">No tracks found</div>
          ) : (
            uniqueTracks.map((track) => (
              <div
                key={track.id}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col space-y-2 ${
                  selectedTrack?.id === track.id ? "bg-blue-100" : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handlePlayTrack(e, track)}
                    className="p-1 text-blue-500 hover:text-blue-600 focus:outline-none"
                  >
                    {playingTrackId === track.id && isPlaying ? (
                      <Pause size={16} weight="fill" />
                    ) : (
                      <Play size={16} weight="fill" />
                    )}
                  </button>

                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      onTrackSelect(track);
                    }}
                  >
                    <p className="text-sm font-medium">{track.title}</p>
                  </div>

                  {playingTrackId === track.id && (
                    <SoundCloudPlayer
                      trackUrl={track.permalinkUrl}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      playerRef={playerRef}
                    />
                  )}
                </div>

                {playingTrackId === track.id && (
                  <ProgressBar
                    progress={progress}
                    currentTime={currentTime}
                    duration={track.duration || 180000}
                    onSeek={handleSeek}
                    mini={true}
                    showTime={false}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {!isSearching && uniqueTracks.length > 0 && (
          <button
            onClick={onLoadMore}
            className="w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-gray-50 border-t cursor-pointer"
          >
            Load more results (+{limit})
          </button>
        )}
      </div>
    </div>
  );
}
