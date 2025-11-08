import type { LucideIcon } from "lucide-react";

export function SidebarItem({
  name,
  Icon,
  isActive,
  onClick,
}: {
  name: string;
  Icon: LucideIcon
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center min-h-12 py-2 pl-8 gap-4 rounded-xs cursor-pointer ${
        isActive
          ? "text-primary font-medium"
          : "hover:bg-primary/15"
      }`}
    >
      <Icon></Icon>
      <p className="">{name}</p>
    </button>
  );
}
