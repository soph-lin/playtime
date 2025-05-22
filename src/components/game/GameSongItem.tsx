"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Song } from "@prisma/client";
import { SoundCloudWidget } from "@/types/soundcloud";
import SoundCloudPlayer from "../player/SoundCloudPlayer";

interface GameSongItemProps {
  song: Song;
  onAdd?: () => void;
  onRemove?: () => void;
  isSelected?: boolean;
}

export default function GameSongItem({ song, onAdd, onRemove, isSelected }: GameSongItemProps) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const playerRef = useRef<SoundCloudWidget | null>(null);

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
      const duration = song.duration || 180000; // Duration is in ms
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
  }, [song.duration]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);

    // Store the current elapsed time when pausing
    pausedTimeRef.current = currentTime;

    // Cancel the interval immediately
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, [currentTime]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const progressBarWidth = rect.width;
      const seekPercentage = (clickPosition / progressBarWidth) * 100;

      // Calculate the new time based on the click position
      const newTime = (seekPercentage / 100) * (song.duration || 180000);

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
    [song.duration, isPlaying]
  );

  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SoundCloudPlayer
            trackUrl={song.permalinkUrl || ""}
            onPlay={handlePlay}
            onPause={handlePause}
            playerRef={playerRef}
            showButton={true}
            buttonClassName="p-2"
          />
          {song.coverUrl && <img src={song.coverUrl} alt={song.title} className="w-16 h-16 object-cover rounded" />}
          <div>
            <h3 className="font-medium">{song.title}</h3>
            <p className="text-sm text-gray-600">{song.artist}</p>
            {song.album && <p className="text-sm text-gray-500">{song.album}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onAdd && !isSelected && (
            <button
              onClick={onAdd}
              className="p-2 text-white bg-blue-500 rounded hover:bg-blue-600 cursor-pointer"
              title="Add to Game"
            >
              Add
            </button>
          )}
          {onRemove && isSelected && (
            <button
              onClick={onRemove}
              className="p-2 text-white bg-red-500 rounded hover:bg-red-600 cursor-pointer"
              title="Remove from Game"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Progress bar at the bottom of the card */}
      <div className="w-full mt-4">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer" onClick={handleSeek}>
          <div className={`h-full ${isPlaying ? "bg-blue-500" : "bg-blue-300"}`} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(song.duration || 180000)}</span>
        </div>
      </div>
    </div>
  );
}
