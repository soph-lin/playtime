import { useRef, useEffect, RefObject, useState } from "react";
import PlayButton from "./PlayButton";
import { SoundCloudWidget } from "@/types/soundcloud";

interface SoundCloudPlayerProps {
  trackUrl: string;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
  buttonClassName?: string;
  autoPlay?: boolean;
  playerRef?: RefObject<SoundCloudWidget | null>;
  showButton?: boolean;
}

export default function SoundCloudPlayer({
  trackUrl,
  onPlay,
  onPause,
  className = "",
  buttonClassName = "",
  autoPlay = false,
  playerRef,
  showButton = false,
}: SoundCloudPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<ReturnType<typeof window.SC.Widget> | null>(null);

  useEffect(() => {
    // Wait for SC to be available
    const initWidget = () => {
      if (window.SC && iframeRef.current) {
        // Initialize the SoundCloud Widget API
        widgetRef.current = window.SC.Widget(iframeRef.current);

        // If playerRef is provided, assign the widget to it
        if (playerRef) {
          playerRef.current = widgetRef.current;
        }

        // Bind events
        widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
          console.log("SoundCloud player ready");
          setIsLoading(false);
        });

        widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
          console.log("SoundCloud player playing");
          setIsPlaying(true);
          if (onPlay) onPlay();
        });

        widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
          console.log("SoundCloud player paused");
          setIsPlaying(false);
          if (onPause) onPause();
        });
      }
    };

    // Try to initialize immediately if SC is already available
    if (window.SC) {
      initWidget();
    } else {
      // If SC is not available, wait for it to load
      const checkSC = setInterval(() => {
        if (window.SC) {
          clearInterval(checkSC);
          initWidget();
        }
      }, 100);

      // Cleanup interval if component unmounts
      return () => clearInterval(checkSC);
    }
  }, [trackUrl, onPlay, onPause, playerRef]);

  const togglePlay = () => {
    if (!widgetRef.current) {
      return;
    }

    if (isPlaying) {
      widgetRef.current.pause();
    } else {
      widgetRef.current.play();
    }
  };

  return (
    <div className={className}>
      {/* Hidden SoundCloud player */}
      <div className="hidden">
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${trackUrl}&color=%23ff5500&auto_play=${autoPlay}&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`}
        />
      </div>

      {showButton && (
        <PlayButton isPlaying={isPlaying} isLoading={isLoading} onClick={togglePlay} className={buttonClassName} />
      )}
    </div>
  );
}
