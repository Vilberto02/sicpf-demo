import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

type SearchableSelectProps<T> = {
  items: T[];
  value: T | null;
  onSelect: (item: T | null) => void;
  getOptionLabel: (item: T) => string;
  getOptionSubLabel?: (item: T) => string;
  filterMatch?: (item: T, query: string) => boolean;
  placeholder?: string;
  emptyMessage?: string;
  maxResults?: number;
  actionButton?: React.ReactNode;
};

export function SearchableSelect<T>({
  items,
  value,
  onSelect,
  getOptionLabel,
  getOptionSubLabel,
  filterMatch,
  placeholder = "Buscar...",
  emptyMessage = "Sin resultados",
  maxResults = 5,
  actionButton,
}: SearchableSelectProps<T>) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  const filteredItems = (items || []).filter((item) =>
    filterMatch
      ? filterMatch(item, query)
      : getOptionLabel(item).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex gap-2 w-full">
      <div className="relative flex-1" ref={wrapperRef}>
        <Input
          placeholder={placeholder}
          value={query || (value ? getOptionLabel(value) : "")}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-background border rounded-md shadow-lg z-50 overflow-hidden">
            {filteredItems.slice(0, maxResults).map((item, index) => (
              <div
                key={getOptionLabel(item) + index}
                className="p-3 hover:bg-muted cursor-pointer text-sm border-b last:border-0"
                onClick={() => {
                  onSelect(item);
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                <p className="font-medium">{getOptionLabel(item)}</p>
                {getOptionSubLabel && (
                  <p className="text-xs text-muted-foreground">
                    {getOptionSubLabel(item)}
                  </p>
                )}
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </div>
        )}
      </div>
      {actionButton}
    </div>
  );
}
