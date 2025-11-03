import { SidebarItem } from "@/components/sidebar/SidebarItem";
import type { SideBarItemType } from "@/types";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

type SidebarProps = {
  items: SideBarItemType[];
  activeItem: string;
  setActiveItem: (id: string) => void;
  isOpen: boolean;
};

export function SideBar({
  items,
  activeItem,
  setActiveItem,
  isOpen,
}: SidebarProps) {
  const navigate = useNavigate();
  return (
    <aside
      className={`h-screen bg-white w-64 flex flex-col items-center py-6 justify-between fixed top-0 left-0 z-40 
        transition-transform duration-300 ease-in-out ${
          isOpen ? "transform translate-x-0" : "transform -translate-x-full"
        }`}
    >
      <div className="flex items-center flex-col gap-4 w-full px-4">
        <div className="font-extrabold text-2xl text-[var(--color-quaternary)] cursor-pointer">
          SICPF
        </div>
        <nav className="flex-grow space-y-2 w-full">
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              name={item.name}
              Icon={item.Icon}
              isActive={activeItem === item.id}
              onClick={() => setActiveItem(item.id)}
            ></SidebarItem>
          ))}
        </nav>
      </div>
      <button
        onClick={() => {
          console.log("Cerrando sesión...");
          alert("Sesión cerrada.");
          navigate("/auth");
        }}
        className="cursor-pointer pl-8 text-left flex items-center gap-4 hover:text-red-700 w-full"
      >
        <LogOut></LogOut>
        Cerrar sesión
      </button>
    </aside>
  );
}
