import { cn } from "@/lib/utils";

interface MenuOptionProps {
  text: string;
  isSelected: boolean;
  className?: string;
  delayMs?: number;
}

export default function MenuOption({ text, isSelected, className, delayMs = 0 }: MenuOptionProps) {
  return (
    <div
      className={cn(
        "text-2xl font-bold transition-all duration-300 plop-animation select-none",
        isSelected ? "text-cerulean scale-110" : "text-slate",
        className
      )}
      style={{
        animationDelay: `${delayMs}ms`,
        opacity: 0,
      }}
    >
      {text}
    </div>
  );
}
