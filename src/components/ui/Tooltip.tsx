import { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5",
          "bg-white text-gray-800 text-sm rounded-lg shadow-lg",
          "whitespace-nowrap",
          "transition-all duration-200 ease-out",
          "transform origin-top",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
          className
        )}
      >
        {content}
      </div>
    </div>
  );
}
