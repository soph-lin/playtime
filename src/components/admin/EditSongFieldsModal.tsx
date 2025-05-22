import { useState, useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";
import { createPortal } from "react-dom";

interface EditSongFieldsModalProps {
  currentDuration: number;
  onSave: (duration: number) => void;
  onClose: () => void;
}

export default function EditSongFieldsModal({ currentDuration, onSave, onClose }: EditSongFieldsModalProps) {
  const [editedDuration, setEditedDuration] = useState(currentDuration);
  const [durationUnit, setDurationUnit] = useState<"ms" | "s">("ms");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger the open animation after mount
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  }, []);

  const handleDurationChange = (value: number, unit: "ms" | "s") => {
    // If we're switching units, just update the unit without changing the stored value
    if (unit !== durationUnit) {
      setDurationUnit(unit);
      return;
    }

    // If not switching units, update the value in the current unit
    setEditedDuration(unit === "ms" ? value : value * 1000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedDuration);
      handleClose();
    } catch (error) {
      console.error("Failed to save duration:", error);
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Wait for the animation to complete before calling onClose
    setTimeout(onClose, 200);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 backdrop-blur-sm bg-white/30 z-50 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50" onClick={handleClose}>
        <div
          ref={modalRef}
          className={`bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-6 w-96 transform transition-all duration-200 ${
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Fields</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Duration:</span>
              <input
                type="number"
                value={durationUnit === "ms" ? editedDuration : editedDuration / 1000}
                onChange={(e) => handleDurationChange(Number(e.target.value), durationUnit)}
                className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <select
                value={durationUnit}
                onChange={(e) => handleDurationChange(editedDuration, e.target.value as "ms" | "s")}
                className="px-1 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ms">ms</option>
                <option value="s">s</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-600 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
