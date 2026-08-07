"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  flag?: string; // ISO 3166-1 alpha-2 code for flagcdn.com
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecciona...",
  searchPlaceholder = "Buscar...",
  disabled,
  className,
  hasError,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((opt) => opt.value === value);
  const filtered = search
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  function handleOpen() {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          hasError ? "border-destructive" : "border-input",
          open && "border-ring ring-3 ring-ring/50"
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2", selected ? "text-foreground" : "text-muted-foreground")}>
          {selected?.flag && (
            <img
              src={`https://flagcdn.com/w40/${selected.flag.toLowerCase()}.png`}
              alt=""
              className="shrink-0"
              width={20}
              height={15}
            />
          )}
          <span className="truncate" title={selected?.label}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="fixed z-50 rounded-lg border bg-popover text-popover-foreground shadow-md"
          style={dropdownStyle}
        >
          <div className="border-b p-1.5">
            <input
              autoFocus
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-56 overflow-x-hidden overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">
                Sin resultados
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    value === opt.value && "bg-accent/50 font-medium"
                  )}
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0 opacity-0",
                      value === opt.value && "opacity-100"
                    )}
                  />
                  {opt.flag && (
                    <img
                      src={`https://flagcdn.com/w40/${opt.flag.toLowerCase()}.png`}
                      alt=""
                      className="shrink-0"
                      width={20}
                      height={15}
                    />
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
