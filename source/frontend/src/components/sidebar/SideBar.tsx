import { SidebarItem } from "@/components/sidebar/SidebarItem";
import type { SideBarItemType } from "@/types";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/SICPF.svg";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "sonner";

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
  const { logoutUser } = useAuthStore();
  const navigate = useNavigate();
  return (
    <aside
      className={`h-screen bg-card w-64 flex flex-col items-center py-6 justify-between fixed top-0 left-0 z-40 border-r border-black/5
        transition-transform duration-300 ease-in-out ${
          isOpen ? "transform translate-x-0" : "transform -translate-x-full"
        }`}
    >
      <div className="flex items-center flex-col gap-4 w-full px-4">
        <div className="font-extrabold text-2xl text-quaternary cursor-pointer">
          <img src={logo} alt="" />
        </div>
        <nav className="grow space-y-2 w-full">
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
          logoutUser();
          toast.info("Sesión cerrada correctamente.");
          navigate("/login");
        }}
        className="cursor-pointer pl-8 text-left flex items-center gap-4 hover:text-red-700 w-full"
      >
        <LogOut></LogOut>
        Cerrar sesión
      </button>
    </aside>
  );
}
