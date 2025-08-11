import { useState, useEffect } from "react";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface HistoryEntry {
  id: string;
  title: string;
  artist: string;
  status: "uploading_playlist" | "uploading_track" | "song_added" | "song_failed" | "already_added";
  message: string;
  error?: {
    step: "spotify" | "soundcloud" | "database";
    message: string;
  };
  timestamp: string;
  progress?: {
    processed: number;
    total: number;
  };
}

// Dummy data for testing UI
export const DUMMY_HISTORY: HistoryEntry[] = [
  {
    id: "1",
    title: "Song 1",
    artist: "Artist 1",
    status: "uploading_playlist",
    message: "Uploading playlist track 'Song 1' by Artist 1...",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Song 2",
    artist: "Artist 2",
    status: "uploading_track",
    message: "Uploading track 'Song 2' by Artist 2...",
    timestamp: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Song 3",
    artist: "Artist 3",
    status: "song_added",
    message: "Added 'Song 3' by Artist 3",
    timestamp: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Song 4",
    artist: "Artist 4",
    status: "song_failed",
    message: "Failed to add 'Song 4' by Artist 4",
    error: {
      step: "spotify",
      message: "Could not find track on Spotify. Please check the URL and try again.",
    },
    timestamp: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Song 5",
    artist: "Artist 5",
    status: "song_failed",
    message: "Failed to add 'Song 5' by Artist 5",
    error: {
      step: "soundcloud",
      message: "Track is not available in your region.",
    },
    timestamp: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Song 6",
    artist: "Artist 6",
    status: "song_failed",
    message: "Failed to add 'Song 6' by Artist 6",
    error: {
      step: "database",
      message: "Failed to save track to database. Please try again later.",
    },
    timestamp: new Date().toISOString(),
  },
  {
    id: "7",
    title: "Song 7",
    artist: "Artist 7",
    status: "already_added",
    message: "'Song 7' by Artist 7 already exists",
    timestamp: new Date().toISOString(),
  },
];

interface UploadHistoryItemProps {
  entry: HistoryEntry;
}

function UploadHistoryItem({ entry }: UploadHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const getBackgroundColor = (status: HistoryEntry["status"]) => {
    switch (status) {
      case "uploading_playlist":
        return "bg-purple-100";
      case "uploading_track":
        return "bg-orange-100";
      case "song_added":
        return "bg-green-100";
      case "song_failed":
        return "bg-red-100";
      case "already_added":
        return "bg-yellow-100";
      default:
        return "bg-gray-100";
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg hover:-translate-y-1 transition-all duration-300 ease-in-out transform",
        entry.status === "song_failed" && "cursor-pointer",
        getBackgroundColor(entry.status),
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      onClick={() => entry.status === "song_failed" && setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm">{entry.message}</span>
        <span className="text-xs text-gray-500">{formatTime(entry.timestamp)}</span>
      </div>
      {entry.status === "song_failed" && entry.error && isExpanded && (
        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
          <p className="font-medium">Error in {entry.error?.step}:</p>
          <p>{entry.error?.message}</p>
        </div>
      )}
    </div>
  );
}

interface UploadHistoryProps {
  entries: HistoryEntry[];
}

export default function UploadHistory({ entries }: UploadHistoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .upload-history-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .upload-history-scroll::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 3px;
      }
      .upload-history-scroll::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }
      .upload-history-scroll::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Calculate overall progress
  const progressEntry = entries.find((entry) => entry.progress);
  const progress = progressEntry?.progress;
  const hasProgress = progress && progress.total > 0;
  const progressPercentage = hasProgress ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="mt-4">
      <button
        className={cn(
          "flex items-center space-x-2 text-gray-700 hover:text-gray-900 cursor-pointer w-full rounded-2xl p-2 shadow-md transition-[text-color,background-color] duration-300 ease-in-out",
          isOpen && "text-gray-900 bg-gray-100",
          entries.length === 0 && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={entries.length === 0}
      >
        <ClockCounterClockwise
          size={20}
          weight="bold"
          color={isOpen ? "black" : "gray"}
          className="transition-all duration-300 ease-in-out"
        />
        <span className="font-medium">History</span>
        <span className="text-sm text-gray-500">({entries.length})</span>
        {hasProgress && (
          <div className="ml-auto flex items-center space-x-2">
            <span className="text-xs text-gray-600">
              {progress.processed}/{progress.total}
            </span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </button>

      <div
        className={cn("mt-2", isOpen ? "max-h-[600px]" : "max-h-0")}
        style={{
          transition: "max-height 1000ms ease-in-out",
          overflow: "hidden",
        }}
      >
        {hasProgress && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900">Upload Progress</span>
              <span className="text-xs text-blue-700">{progressPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-700 mt-1">
              <span>{progress.processed} songs processed</span>
              <span>{progress.total - progress.processed} remaining</span>
            </div>
          </div>
        )}
        <div
          className="space-y-2 pt-1 max-h-[600px] overflow-y-auto pr-2 upload-history-scroll"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db #f3f4f6",
          }}
        >
          {entries.map((entry) => (
            <UploadHistoryItem key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
