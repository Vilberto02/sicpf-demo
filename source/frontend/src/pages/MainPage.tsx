import { AlertSection } from "@/components/sections/AlertSection";
import { InventorySection } from "@/components/sections/InventorySection";
import { OverviewSection } from "@/components/sections/OverviewSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { SaleSection } from "@/components/sections/SaleSection";
import { SideBar } from "@/components/sidebar/SideBar";
import type { SideBarItemType } from "@/types";
import {
  Menu,
  ChartNoAxesColumnDecreasing,
  Package,
  ShoppingCart,
  Siren,
  User,
  UserCircle2,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store";
import { Navigate } from "react-router";

const sidebarItems: SideBarItemType[] = [
  { id: "general", name: "General", Icon: ChartNoAxesColumnDecreasing },
  { id: "inventario", name: "Inventario", Icon: Package },
  { id: "ventas", name: "Ventas", Icon: ShoppingCart },
  { id: "alertas", name: "Alertas", Icon: Siren },
  { id: "perfil", name: "Perfil", Icon: User },
];

const sections: Record<string, React.ReactNode> = {
  general: <OverviewSection></OverviewSection>,
  inventario: <InventorySection></InventorySection>,
  ventas: <SaleSection></SaleSection>,
  alertas: <AlertSection></AlertSection>,
  perfil: <ProfileSection></ProfileSection>,
};

export function MainPage() {
  const [activeItem, setActiveItem] = useState("general");
  const [isSidebarOpen, setIsSiderOpen] = useState(true);
  const { isAuthenticated, userProfile } = useAuthStore();

  const name = userProfile?.first_name || "Cargando...";
  const lastname = userProfile?.last_name || "";

  const toggleSidebar = () => {
    setIsSiderOpen(!isSidebarOpen);
  };

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex w-screen h-screen">
      <SideBar
        items={sidebarItems}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        isOpen={isSidebarOpen}
      ></SideBar>
      <div
        className={`flex flex-col w-full ${isSidebarOpen ? "ml-64" : "ml-0"}`}
      >
        <div className="flex items-center justify-between px-4 py-6 gap-6">
          <Menu
            className="cursor-pointer select-none"
            onClick={toggleSidebar}
          ></Menu>
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="flex items-center gap-2">
              <UserCircle2></UserCircle2>
              <p className="select-none line-clamp-1 md:line-clamp-0">
                {name}, {lastname}
              </p>
            </div>
          </div>
        </div>
        <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
          {sections[activeItem]}
        </main>
      </div>
    </div>
  );
}
