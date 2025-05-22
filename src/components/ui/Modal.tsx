"use client";

import { useEffect, useRef } from "react";
import RippleText from "../effects/RippleText";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ title, isOpen, onClose, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleCloseKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleCloseKey);
      // Store the currently focused element
      const previousActiveElement = document.activeElement as HTMLElement;

      // Focus the modal when it opens
      if (modalRef.current) {
        modalRef.current.focus();
      }

      return () => {
        window.removeEventListener("keydown", handleCloseKey);
        // Restore focus to the previous element when modal closes
        if (previousActiveElement) {
          previousActiveElement.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={cn("fixed inset-0 bg-transparent z-50", isOpen ? "visible" : "invisible")} onClick={onClose}>
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-2xl border-2 border-cerulean bg-white box-shadow-lg p-8 overflow-hidden transition-all duration-300 ease-in-out focus:outline-none focus:ring-0",
          isOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <>
          <div className="flex justify-center items-center">
            <RippleText
              text={title}
              className="text-[40px] font-bold text-outline-lg text-white mb-4"
              outline="cerulean"
            />
          </div>
          <div className="flex-1 min-h-0">{children}</div>
        </>
      </div>
    </div>,
    document.body
  );
}
