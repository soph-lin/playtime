import React, { useState, useRef } from "react";
import { formatTime } from "./utils";

interface ProgressBarProps {
  progress: number; // 0-100
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  showTime?: boolean;
  mini?: boolean;
  className?: string;
}

/**
 * A reusable progress bar component for audio players
 *
 * @param progress - Current progress as a percentage (0-100)
 * @param currentTime - Current time in milliseconds
 * @param duration - Total duration in milliseconds
 * @param onSeek - Callback function when user seeks to a position
 * @param showTime - Whether to show time information
 * @param mini - Whether to use a mini version of the progress bar
 * @param className - Additional CSS classes
 */
export default function ProgressBar({
  progress,
  currentTime,
  duration,
  onSeek,
  showTime = true,
  mini = false,
  className = "",
}: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const calculateNewTime = (clientX: number) => {
    if (!progressBarRef.current || !onSeek) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = clientX - rect.left;
    const progressBarWidth = rect.width;
    const seekPercentage = Math.max(0, Math.min(100, (clickPosition / progressBarWidth) * 100));
    const newTime = (seekPercentage / 100) * duration;
    onSeek(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    calculateNewTime(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      calculateNewTime(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) {
      calculateNewTime(e.clientX);
    }
  };

  // Add event listeners for mouse up outside the component
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={progressBarRef}
        className={`w-full ${mini ? "h-2" : "h-6"} bg-gray-200 rounded-full overflow-hidden cursor-pointer`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className={`h-full ${mini ? "bg-blue-300" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
      </div>

      {showTime && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
