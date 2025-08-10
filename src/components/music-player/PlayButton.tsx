import { Play, Pause, Spinner } from "@phosphor-icons/react";

interface PlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: number;
  className?: string;
}

export default function PlayButton({ isPlaying, isLoading, onClick, size = 24, className = "" }: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 text-blue-500 hover:text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 focus:outline-none ${className} cursor-pointer`}
      disabled={isLoading}
    >
      {isLoading ? (
        <Spinner size={size} weight="bold" className="animate-spin" />
      ) : isPlaying ? (
        <Pause size={size} weight="fill" />
      ) : (
        <Play size={size} weight="fill" />
      )}
    </button>
  );
}
