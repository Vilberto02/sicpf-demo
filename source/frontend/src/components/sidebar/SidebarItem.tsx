import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { SideBarItemType } from "@/types";

type SidebarItemProps = {
  item: SideBarItemType;
  activeItem: string;
  onSelect: (id: string) => void;
};

export function SidebarItem({ item, activeItem, onSelect }: SidebarItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const children = item.children;
  const hasChildren = !!children && children.length > 0;

  if (!hasChildren) {
    return (
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className={`w-full flex items-center min-h-12 py-2 pl-8 gap-4 rounded-xs cursor-pointer ${
          activeItem === item.id
            ? "text-primary font-medium"
            : "hover:bg-primary/15"
        }`}
      >
        <item.Icon />
        <p>{item.name}</p>
      </button>
    );
  }

  const groupActive = children.some((child) => child.id === activeItem);
  const expanded = isOpen || groupActive;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={expanded}
        className={`w-full flex items-center min-h-12 py-2 pl-8 gap-4 rounded-xs cursor-pointer ${
          groupActive
            ? "text-primary font-medium"
            : "hover:bg-primary/15"
        }`}
      >
        <item.Icon />
        <p className="flex-1 text-left">{item.name}</p>
        <ChevronDown
          className={`mr-3 h-4 w-4 shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`w-full overflow-hidden transition-all duration-200 ease-in-out ${
          expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children.map((child) => (
          <button
            key={child.id}
            type="button"
            onClick={() => onSelect(child.id)}
            className={`w-full flex items-center min-h-10 py-1.5 pl-14 pr-4 text-sm rounded-xs cursor-pointer ${
              activeItem === child.id
                ? "text-primary font-medium bg-primary/10"
                : "text-muted-foreground hover:bg-primary/15 hover:text-foreground"
            }`}
          >
            {child.name}
          </button>
        ))}
      </div>
    </div>
  );
}
