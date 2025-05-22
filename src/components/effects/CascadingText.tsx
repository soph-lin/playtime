"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CascadingTextProps {
  text: string;
  className?: string;
  letterClassName?: string;
  delayMs?: number;
  onComplete?: () => void;
}

export default function CascadingText({
  text,
  className,
  letterClassName,
  delayMs = 100,
  onComplete,
}: CascadingTextProps) {
  const [visibleLetters, setVisibleLetters] = useState<boolean[]>(new Array(text.length).fill(false));

  useEffect(() => {
    console.log("Starting animation for text:", text);
    const timers: NodeJS.Timeout[] = [];

    text.split("").forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleLetters((prev) => {
          const next = [...prev];
          next[index] = true;
          console.log(`Letter ${index} visible:`, next);
          return next;
        });

        if (index === text.length - 1 && onComplete) {
          console.log("Animation complete, calling onComplete");
          setTimeout(onComplete, 500);
        }
      }, index * delayMs);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [text, delayMs, onComplete]);

  return (
    <div className={cn("flex", className)}>
      {text.split("").map((letter, index) => (
        <span
          key={index}
          className={cn(letterClassName, letter === " " && "mr-[1ch]")}
          style={{
            transform: visibleLetters[index] ? "translateY(0)" : "translateY(-100%)",
            opacity: visibleLetters[index] ? 1 : 0,
            transitionProperty: "all",
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            transitionDuration: "500ms",
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
