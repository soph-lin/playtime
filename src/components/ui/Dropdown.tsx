import { useState, useRef, useEffect, forwardRef } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  options: string[];
  onSelect: (option: string) => void;
  placeholder?: string;
  value?: string | null;
  className?: string;
}

interface DropdownRef {
  focus: () => void;
}

const Dropdown = forwardRef<DropdownRef, DropdownProps>(
  ({ options, onSelect, placeholder = "Select an option...", value, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setSelectedOption(value ?? null);
    }, [value]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleSelect = (option: string) => {
      setSelectedOption(option);
      setSearchTerm(""); // Reset search
      setIsOpen(false);
      onSelect(option);
    };

    const filteredOptions = options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions.length > 0) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    // Expose focus method
    useEffect(() => {
      if (ref && typeof ref !== "function") {
        (ref as React.MutableRefObject<DropdownRef>).current = {
          focus: () => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          },
        };
      }
    }, [ref]);

    return (
      <div className={cn("relative w-full cursor-pointer", className)} ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-2 text-left bg-white border-2 rounded-md shadow-sm flex items-center justify-between",
            isOpen ? "border-primary" : "border-primary focus:border-primary"
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={searchTerm || selectedOption || ""}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onClick={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 focus:outline-none bg-transparent"
            placeholder={!selectedOption ? placeholder : ""}
          />
          <CaretDown
            size={20}
            weight="bold"
            className={cn("text-gray-500 transition-transform duration-200 ease-in-out", isOpen && "rotate-180")}
          />
        </div>

        {/* Dropdown list */}
        <div
          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg transition-all duration-200 ease-in-out ${
            isOpen ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors duration-150",
                    index === highlightedIndex && "bg-gray-100"
                  )}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No results found</div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Dropdown.displayName = "Dropdown";

export default Dropdown;
