import { useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { KIND_LABEL, searchPlaces, type Place } from "@/lib/mobility/places";

interface PlaceSearchProps {
  label: string;
  placeholder: string;
  value: Place | null;
  onSelect: (place: Place | null) => void;
  marker: "origin" | "dest";
  autoFocus?: boolean;
}

export function PlaceSearch({ label, placeholder, value, onSelect, marker, autoFocus }: PlaceSearchProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setQuery(value?.name ?? "");
  }

  const results = useMemo(() => searchPlaces(query === value?.name ? "" : query), [query, value]);

  const choose = (p: Place) => {
    onSelect(p);
    setQuery(p.name);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-ink focus-within:ring-2 focus-within:ring-signal">
        <span
          aria-hidden
          className={cn(
            "size-3 shrink-0 rounded-full border-2 border-ink",
            marker === "dest" ? "bg-signal" : "bg-card",
          )}
        />
        <span className="sr-only">{label}</span>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={label}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={query}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
            if (!e.target.value) onSelect(null);
          }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              choose(results[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </label>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-[1100] mt-1.5 max-h-72 overflow-auto rounded-xl border border-border bg-popover p-1 shadow-float"
        >
          {results.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">Nenhum local encontrado em SP.</li>
          )}
          {results.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2",
                i === active && "bg-secondary",
              )}
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.address} · {KIND_LABEL[p.kind]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
