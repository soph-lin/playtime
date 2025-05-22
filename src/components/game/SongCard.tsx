"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Plus, MusicNote, SkipForward, SpinnerGap } from "@phosphor-icons/react";
import RippleText from "../effects/RippleText";
import ProgressBar from "../player/ProgressBar";
import { toast } from "react-hot-toast";
import { Tooltip } from "../ui/Tooltip";
import { SoundCloudWidget } from "@/types/soundcloud";

// Add SC type definition
declare const SC: {
  Widget: {
    Events: {
      READY: string;
      PLAY: string;
      PAUSE: string;
      FINISH: string;
    };
  };
};

interface SongCardProps {
  trackUrl: string;
  trackTitle: string;
  artistName: string;
  onOpenGuessModal: () => void;
  attempts: number;
  onGiveUp: () => void;
  status: "guessing" | "correct" | "incorrect";
}

export function SongCard({
  trackUrl,
  trackTitle,
  artistName,
  onOpenGuessModal,
  attempts,
  onGiveUp,
  status,
}: SongCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clipDuration, setClipDuration] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const [fullDuration, setFullDuration] = useState(0);
  const [widgetError, setWidgetError] = useState(false);

  // Initialize the widget and load the audio
  useEffect(() => {
    if (!window.SC || !window.SC.Widget) {
      console.error("SoundCloud widget not initialized");
      setWidgetError(true);
      return;
    }

    console.log("Track URL changed, resetting widget:", trackUrl);
    // Clean up any existing widget first
    if (widgetRef.current) {
      try {
        widgetRef.current.pause();
        widgetRef.current.unbind(window.SC.Widget.Events.READY);
        widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
        widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
        widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
      } catch (error) {
        console.error("Error cleaning up widget:", error);
      }
      widgetRef.current = null;
    }

    // Reset all states
    setIsLoading(true);
    setIsReady(false);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setFullDuration(0);
    setWidgetError(false);

    if (playerRef.current) {
      try {
        console.log("Creating new widget");
        // Create new widget
        const widget = window.SC.Widget(playerRef.current) as unknown as SoundCloudWidget;
        widgetRef.current = widget;

        const bindEvents = () => {
          try {
            // Bind play event
            widget.bind(SC.Widget.Events.PLAY, () => {
              console.log("Widget PLAY event fired, setting isPlaying to true");
              setIsPlaying(true);
              setIsLoading(false);
            });

            // Bind pause event
            widget.bind(SC.Widget.Events.PAUSE, () => {
              console.log("Widget PAUSE event fired, setting isPlaying to false");
              setIsPlaying(false);
              setIsLoading(false);
            });

            // Bind finish event
            widget.bind(SC.Widget.Events.FINISH, () => {
              console.log("Widget FINISH event fired, setting isPlaying to false");
              setIsPlaying(false);
              setIsLoading(false);
              setProgress(0);
              setCurrentTime(0);
            });
          } catch (error) {
            console.error("Error binding widget events:", error);
            setWidgetError(true);
          }
        };

        // Bind ready event
        widget.bind(SC.Widget.Events.READY, () => {
          console.log("Widget READY event fired");
          if (!widgetRef.current) return;

          try {
            // Bind other events after widget is ready
            bindEvents();

            // Get the full song duration
            widget.getCurrentSound((sound) => {
              console.log("Got current sound duration:", sound.duration);
              if (!widgetRef.current) return;
              setFullDuration(sound.duration / 1000);
              setIsReady(true);
              setIsLoading(false);
            });
          } catch (error) {
            console.error("Error in widget ready handler:", error);
            setWidgetError(true);
          }
        });
      } catch (error) {
        console.error("Error initializing widget:", error);
        setWidgetError(true);
      }
    }

    return () => {
      console.log("Cleanup effect running");
      if (widgetRef.current) {
        try {
          widgetRef.current.pause();
          widgetRef.current.unbind(SC.Widget.Events.READY);
          widgetRef.current.unbind(SC.Widget.Events.PLAY);
          widgetRef.current.unbind(SC.Widget.Events.PAUSE);
          widgetRef.current.unbind(SC.Widget.Events.FINISH);
        } catch (error) {
          console.error("Error in cleanup:", error);
        }
        widgetRef.current = null;
      }
      setIsPlaying(false);
      setIsLoading(false);
      setIsReady(false);
    };
  }, [trackUrl, status]);

  // Handle status changes (e.g., when answer is revealed)
  useEffect(() => {
    if (isReady && widgetRef.current) {
      if (status !== "guessing") {
        // Auto-play full song when answer is revealed
        handlePlayFullSong();
      } else {
        // Reset state when starting a new song
        setProgress(0);
        setCurrentTime(0);
        if (progressIntervalRef.current !== null) {
          window.clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }
  }, [status, isReady]);

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.bind(SC.Widget.Events.PLAY, () => {
        if (widgetRef.current) {
          setIsPlaying(true);
          setIsLoading(false);
        }
      });

      widgetRef.current.bind(SC.Widget.Events.PAUSE, () => {
        if (widgetRef.current) {
          setIsPlaying(false);
          setIsLoading(false);
        }
      });

      widgetRef.current.bind(SC.Widget.Events.FINISH, () => {
        if (widgetRef.current) {
          setIsPlaying(false);
          setIsLoading(false);
          setProgress(0);
          setCurrentTime(0);
        }
      });

      return () => {
        if (widgetRef.current) {
          widgetRef.current.unbind(SC.Widget.Events.PLAY);
          widgetRef.current.unbind(SC.Widget.Events.PAUSE);
          widgetRef.current.unbind(SC.Widget.Events.FINISH);
        }
      };
    }
  }, [widgetRef.current]);

  useEffect(() => {
    if (widgetRef.current && isPlaying) {
      const updateProgress = () => {
        if (!widgetRef.current) return;

        widgetRef.current.getPosition((position) => {
          const currentTime = position / 1000; // Convert to seconds
          setCurrentTime(currentTime * 1000);

          if (status === "guessing") {
            const progress = (currentTime / clipDuration) * 100;
            setProgress(Math.min(progress, 100));

            // Auto-pause when clip duration is reached
            if (currentTime >= clipDuration && widgetRef.current) {
              widgetRef.current.pause();
              setIsPlaying(false);
              setProgress(100);
              setCurrentTime(clipDuration * 1000);
            }
          } else {
            // In non-guessing mode, use full song duration for progress
            if (widgetRef.current) {
              widgetRef.current.getDuration((duration) => {
                const progress = (currentTime / (duration / 1000)) * 100;
                setProgress(Math.min(progress, 100));
              });
            }
          }
        });
      };

      // Clear any existing interval
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Set up new interval if playing
      progressIntervalRef.current = window.setInterval(updateProgress, 50);

      return () => {
        if (progressIntervalRef.current !== null) {
          window.clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
    }
  }, [isPlaying, status, clipDuration]);

  const handlePlay = () => {
    console.log("handlePlay called, current states:", { isReady, isPlaying, isLoading });
    if (!widgetRef.current) {
      console.log("No widget, setting loading");
      setIsLoading(true);
      return;
    }

    if (!isReady) {
      console.log("Not ready, setting loading");
      setIsLoading(true);
      return;
    }

    if (isPlaying) {
      console.log("Already playing, handling pause");
      handlePause();
      return;
    }

    setIsPlaying(true);
    setIsLoading(false);

    if (status === "guessing") {
      handlePlayClip();
    } else {
      handlePlayFullSong();
    }
  };

  const handlePause = () => {
    console.log("handlePause called, current states:", { isReady, isPlaying, isLoading });
    if (!widgetRef.current) return;

    setIsPlaying(false);
    setIsLoading(false);
    widgetRef.current.pause();
  };

  const handlePlayClip = () => {
    console.log("handlePlayClip called");
    if (!widgetRef.current) return;

    // Reset state
    setProgress(0);
    setCurrentTime(0);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;

    // Start playback
    widgetRef.current.seekTo(0);
    widgetRef.current.play();
  };

  const handlePlayFullSong = () => {
    console.log("handlePlayFullSong called");
    if (!widgetRef.current) return;

    // Start playback from current position
    widgetRef.current.play();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (widgetRef.current) {
        widgetRef.current.pause();
        widgetRef.current.unbind(window.SC.Widget.Events.READY);
        widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
        widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
        widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
        widgetRef.current = null;
      }
      setIsPlaying(false);
      setIsLoading(false);
      setIsReady(false);
    };
  }, []);

  const handleAddSecond = () => {
    if (clipDuration < 5) {
      setClipDuration((prev) => prev + 1);
      toast(`Added 1s!`);
    } else {
      toast("Maximum duration reached!");
    }
  };

  // Add keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === "INPUT";

      if (!isInput) {
        if (e.key === " ") {
          e.preventDefault();
          if (isPlaying) {
            handlePause();
          } else {
            handlePlay();
          }
        } else if (e.key === "ArrowRight" && !isPlaying && clipDuration < 5) {
          e.preventDefault();
          if (status === "guessing") handleAddSecond();
        } else if (e.key === "/" || e.key === "g") {
          e.preventDefault();
          if (status === "guessing") onOpenGuessModal();
        } else if (e.key === "s") {
          e.preventDefault();
          onGiveUp();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, clipDuration, onGiveUp, handlePlay, handlePause, onOpenGuessModal]);

  useEffect(() => {
    const handleResetTiming = () => {
      setClipDuration(1);
    };

    window.addEventListener("resetTiming", handleResetTiming);
    return () => {
      window.removeEventListener("resetTiming", handleResetTiming);
    };
  }, []);

  if (widgetError) {
    return (
      <div className="text-center p-4 text-red-500">
        Error loading audio player. Please refresh the page and try again.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-8 border-2 border-blue-200 rounded-xl shadow-xl bg-white space-y-4">
      {/* Song title display with animated background */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-pink-600 py-10 px-6">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
                animation: `pulse ${Math.random() * 3 + 2}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
          <RippleText
            text={status === "guessing" ? "Mystery Song" : trackTitle}
            className="text-white text-4xl font-bold"
          />
          {status !== "guessing" && (
            <RippleText text={artistName} className="text-white text-2xl font-medium" outline="" />
          )}
        </div>
      </div>
      {status !== "guessing" && (
        <div className="text-foreground text-lg flex justify-center mb-2">
          {status === "correct" ? (
            <div className="flex items-center gap-2">
              <span>
                Congrats! You got the song in {attempts} {attempts === 1 ? "guess" : "guesses"}. Press
              </span>
              <SkipForward className="w-5 h-5" />
              <span>to go to the next song.</span>
            </div>
          ) : status === "incorrect" ? (
            <div className="flex items-center gap-2">
              <span>Better luck next time! Press</span>
              <SkipForward className="w-5 h-5" />
              <span>to go to the next song.</span>
            </div>
          ) : null}
        </div>
      )}
      {/* Hidden embed player */}
      <div className="w-0 h-0 overflow-hidden">
        <iframe
          ref={playerRef}
          width="100%"
          height="100%"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${trackUrl}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`}
        />
      </div>

      <div className="space-y-4">
        {/* Controls and progress bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Tooltip content="Play">
              <button
                onClick={handlePlay}
                disabled={isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-md disabled:hover:bg-blue-600 outline-none"
              >
                {isLoading ? (
                  <SpinnerGap className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Add 1s">
              <button
                onClick={handleAddSecond}
                disabled={isPlaying || clipDuration >= 5 || status !== "guessing"}
                className="p-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-md disabled:hover:bg-pink-600 outline-none"
              >
                <Plus className="w-6 h-6" />
              </button>
            </Tooltip>
            <Tooltip content="Guess">
              <button
                onClick={onOpenGuessModal}
                disabled={status !== "guessing"}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-md disabled:hover:bg-purple-600 outline-none"
              >
                <MusicNote className="w-6 h-6" />
              </button>
            </Tooltip>
            <Tooltip content={status === "guessing" ? "Skip" : "Next Song"}>
              <button
                onClick={onGiveUp}
                className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 outline-none"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </Tooltip>
            <span className="text-sm text-gray-600">{clipDuration}s</span>
          </div>
          <div className="flex-1">
            <ProgressBar
              progress={progress}
              currentTime={currentTime}
              duration={status === "guessing" ? clipDuration * 1000 : fullDuration * 1000}
              mini={true}
              showTime={false}
            />
          </div>
        </div>

        {/* Music equalizer visualization */}
        <div className="flex justify-center items-end h-12 gap-1 mt-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-2 bg-gradient-to-t from-blue-600 to-pink-500 rounded-t transition-all duration-500"
              style={{
                height: isPlaying ? `${Math.random() * 80 + 20}%` : "10%",
                animationName: isPlaying ? "bounce" : "none",
                animationDuration: `${Math.random() * 0.5 + 0.2}s`,
                animationIterationCount: "infinite",
                animationDirection: "alternate",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0% {
            height: 10%;
          }
          100% {
            height: 90%;
          }
        }
      `}</style>
    </div>
  );
}
