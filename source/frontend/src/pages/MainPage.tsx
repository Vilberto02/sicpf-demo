import { AlertSection } from "@/components/sections/AlertSection";
import { InventorySection } from "@/components/sections/InventorySection";
import { OverviewSection } from "@/components/sections/OverviewSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { SaleSection } from "@/components/sections/SaleSection";
import { SideBar } from "@/components/sidebar/SideBar";
import type { SideBarItemType } from "@/types";
import { Menu, ChartNoAxesColumnDecreasing, Package, ShoppingCart, Siren, User, UserCircle2} from "lucide-react";
import { useState } from "react";

const sidebarItems: SideBarItemType[] = [
  { id: "general", name: "General", Icon: ChartNoAxesColumnDecreasing, },
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

  const toggleSidebar = () => {
    setIsSiderOpen(!isSidebarOpen);
  };
  const name = "Carlos";
  const lastname = "Rodriguez";
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
        <div className="flex items-center justify-between px-4 py-6">
          <Menu
            className="cursor-pointer select-none"
            onClick={toggleSidebar}
          ></Menu>
          <div className="flex items-center gap-2 cursor-pointer">
            <UserCircle2></UserCircle2>
            <p className="select-none">{name}, {lastname}</p>
          </div>
        </div>
        <main className="flex-1 p-10 border-red-800 border-2 overflow-x-hidden">
          {sections[activeItem]}
        </main>
      </div>
    </div>
  );
}
