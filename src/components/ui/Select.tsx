"use client";

import * as React from "react";
import { CaretCircleDownIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    { value, onChange, options, placeholder = "Select an option", className, disabled = false, searchable = true },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedOption, setSelectedOption] = React.useState<SelectOption | undefined>(
      options.find((opt) => opt.value === value)
    );
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update selected option when value prop changes
    React.useEffect(() => {
      setSelectedOption(options.find((opt) => opt.value === value));
    }, [value, options]);

    // Focus search input when dropdown opens
    React.useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }, [isOpen, searchable]);

    const handleToggle = () => {
      if (disabled) return;
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery("");
      }
    };

    const handleSelect = (option: SelectOption) => {
      setSelectedOption(option);
      onChange?.(option.value);
      setIsOpen(false);
      setSearchQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    // Filter options based on search query
    const filteredOptions =
      searchable && searchQuery
        ? options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    return (
      <div className={cn("relative", className)} ref={ref}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
            "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:border-gray-400"
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={cn("truncate", selectedOption ? "text-gray-900" : "text-gray-500")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <CaretCircleDownIcon
            size={16}
            className={cn("transition-transform duration-200 text-gray-400", isOpen && "rotate-180")}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
            style={{
              animation: "dropdownSlide 200ms ease-out",
            }}
          >
            {/* Search input */}
            {searchable && (
              <div className="border-b border-gray-100 p-2">
                <div className="relative">
                  <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <XIcon size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left transition-colors",
                      "hover:bg-blue-50 hover:text-blue-900",
                      "focus:outline-none focus:bg-blue-50 focus:text-blue-900",
                      selectedOption?.value === option.value && "bg-blue-100 text-blue-900"
                    )}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  {searchQuery ? "No options found" : "No options available"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CSS Animation */}
        <style jsx>{`
          @keyframes dropdownSlide {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export type { SelectOption };
