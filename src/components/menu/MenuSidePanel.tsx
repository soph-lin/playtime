import { useEffect } from "react";
import RippleText from "../effects/RippleText";

interface MenuSidePanelProps {
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuSidePanel({ title, content, isOpen, onClose }: MenuSidePanelProps) {
  const handleCloseKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleCloseKey);
    return () => window.removeEventListener("keydown", handleCloseKey);
  }, [onClose]);

  return (
    <div
      className={`absolute w-[40%] h-[70%] flex flex-col gap-8 rounded-2xl border-2 border-cerulean bg-white box-shadow-lg p-8 
        transform transition-all duration-300 ease-in-out origin-center
        ${isOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"}`}
    >
      {isOpen && (
        <>
          <RippleText text={title} className="text-[40px] font-bold text-outline-lg text-white" outline="cerulean" />
          {content}
        </>
      )}
    </div>
  );
}
