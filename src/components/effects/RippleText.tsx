"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface RippleTextProps {
  text: string;
  outline?: string;
  randomRipple?: boolean;
  className?: string;
  letterClassName?: string;
  style?: React.CSSProperties;
}

export default function RippleText({
  text,
  className,
  letterClassName,
  outline = "cerulean",
  randomRipple = false,
}: RippleTextProps) {
  const [rippleIndex, setRippleIndex] = useState<number | null>(null);
  const [, setAnimationTrigger] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const animationRef = useRef<number | undefined>(undefined);

  // Random ripple effect
  useEffect(() => {
    if (!randomRipple) return;

    const idleInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        setRippleIndex(0);
      }
    }, 2000);

    return () => clearInterval(idleInterval);
  }, []);

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

  // Smooth idle animation using requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      setAnimationTrigger((prev) => prev + 1); // Trigger re-render
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("flex overflow-visible relative select-none", className)}>
      {text.split("").map((letter, index) => {
        const time = Date.now() - startTimeRef.current;
        const idleOffset = Math.sin(time / 200 + index) * 3;

        return (
          <span
            key={index}
            className={cn("text-outline-lg", letterClassName, letter === " " && "mr-[1ch]")}
            style={{
              ...(outline && { "--outline-color": `var(--color-${outline})` }),
              transform: `translateY(${
                idleOffset +
                (rippleIndex !== null && rippleIndex >= index ? -15 * Math.sin((rippleIndex - index) * 0.5) : 0)
              }px)`,
              transitionProperty: "all",
              transitionTimingFunction: "cubic-bezier(0.2, 0, 0.2, 1)",
              transitionDuration: rippleIndex !== null ? "100ms" : "300ms",
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}
