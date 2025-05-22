"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface AnimatedTitleProps {
  text: string;
  className?: string;
  letterClassName?: string;
  delayMs?: number;
  onComplete?: () => void;
}

export default function AnimatedTitle({
  text,
  className,
  letterClassName,
  delayMs = 100,
  onComplete,
}: AnimatedTitleProps) {
  const [visibleLetters, setVisibleLetters] = useState<boolean[]>(new Array(text.length).fill(false));
  const [rippleIndex, setRippleIndex] = useState<number | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isCascadeComplete, setIsCascadeComplete] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());

  // Initial cascade animation
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    text.split("").forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleLetters((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });

        if (index === text.length - 1) {
          setTimeout(() => {
            if (!hasExpanded) {
              setIsExpanding(true);
              setHasExpanded(true);
              setTimeout(() => {
                setIsExpanding(false);
                setIsCascadeComplete(true);
                if (onComplete) {
                  onComplete();
                }
              }, 600);
            }
          }, 200);
        }
      }, index * delayMs);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [text, delayMs, onComplete, hasExpanded]);

  // Idle animation and random ripple - only start after cascade is complete
  useEffect(() => {
    if (!isCascadeComplete) return;

    const idleInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        setRippleIndex(0);
      }
    }, 2000);

    return () => clearInterval(idleInterval);
  }, [isCascadeComplete]);

  // Ripple animation
  useEffect(() => {
    if (rippleIndex === null) return;

    if (rippleIndex < text.length) {
      const timer = setTimeout(() => {
        setRippleIndex(rippleIndex + 1);
      }, 30);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setRippleIndex(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [rippleIndex, text.length]);

  // Smooth idle animation using requestAnimationFrame - only start after cascade is complete
  useEffect(() => {
    if (!isCascadeComplete) return;

    const animate = () => {
      setVisibleLetters((prev) => [...prev]); // Trigger re-render
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isCascadeComplete]);

  return (
    <div
      className={cn("flex overflow-visible relative select-none text-7xl font-bold mb-8 text-baby-blue", className)}
      style={{ "--outline-color": "var(--color-cerulean)" }}
    >
      {text.split("").map((letter, index) => {
        const time = Date.now() - startTimeRef.current;
        const idleOffset = isCascadeComplete ? Math.sin(time / 200 + index) * 5 : 0;

        return (
          <span
            key={index}
            className={cn(letterClassName, letter === " " && "mr-[1ch]", isExpanding && "absolute", "text-outline-lg")}
            style={{
              transform: visibleLetters[index]
                ? `translateY(${
                    isCascadeComplete
                      ? idleOffset +
                        (rippleIndex !== null && rippleIndex >= index ? -25 * Math.sin((rippleIndex - index) * 0.5) : 0)
                      : -5
                  }px) scale(${isExpanding ? 10 : 1})`
                : "translateY(-100%) scale(1)",
              opacity: visibleLetters[index] ? (isExpanding ? 0 : 1) : 0,
              transitionProperty: "all",
              transitionTimingFunction: isCascadeComplete
                ? isExpanding
                  ? "cubic-bezier(0.4, 0, 0.2, 1)"
                  : "cubic-bezier(0.2, 0, 0.2, 1)"
                : "cubic-bezier(0.2, 1.5, 0.2, 1)",
              transitionDuration: isCascadeComplete
                ? isExpanding
                  ? "600ms"
                  : rippleIndex !== null
                    ? "100ms"
                    : "300ms"
                : "300ms",
              ...(isExpanding && {
                left: `${index * 1.5}ch`,
                transformOrigin: "center center",
              }),
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}
