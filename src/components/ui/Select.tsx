"use client";

import * as React from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
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

    // Filter options based on search query
    const filteredOptions =
      searchable && searchQuery
        ? options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    return (
      <div className={cn("relative", className)} ref={ref}>
        {/* Trigger button / Search input */}
        <div
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
            "focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:border-gray-400"
          )}
        >
          {isOpen ? (
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none placeholder:text-gray-500"
            />
          ) : (
            <span
              className={cn("flex-1 truncate cursor-pointer", selectedOption ? "text-gray-900" : "text-gray-500")}
              onClick={handleToggle}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
          <CaretDownIcon
            size={16}
            className={cn("transition-transform duration-200 text-gray-400 cursor-pointer", isOpen && "rotate-180")}
            onClick={handleToggle}
          />
        </div>

        {/* Dropdown */}
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden transition-all duration-300 ease-out",
            isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {/* Options list */}
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-3 py-2 text-sm text-left transition-colors rounded-md",
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
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export type { SelectOption };
