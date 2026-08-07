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
  Mail,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store";
import { Navigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const email = userProfile?.email || "usuario@ejemplo.com";

  const toggleSidebar = () => {
    setIsSiderOpen(!isSidebarOpen);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
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
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"}`}
      >
        <div className="flex items-center justify-between px-4 py-6 gap-6">
          <Menu
            className="cursor-pointer select-none"
            onClick={toggleSidebar}
          ></Menu>
          
          <Dialog>
            <DialogTrigger asChild>
              <div className="flex items-center gap-4 cursor-pointer hover:bg-stone-100 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="text-primary"></UserCircle2>
                  <p className="select-none line-clamp-1 md:line-clamp-0 font-medium text-sm">
                    {name}, {lastname}
                  </p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card ring-1 ring-black/5 shadow-xl rounded-2xl border-0">
              <DialogHeader>
                <DialogTitle className="text-2xl text-primary font-semibold tracking-tight text-center mt-4">
                  Credencial de Usuario
                </DialogTitle>
                <DialogDescription className="text-center">
                  Información del perfil activo.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col items-center justify-center py-6 gap-4">
                <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <UserCircle2 size={64} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground">
                    {name} {lastname}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
                    <Mail size={14} /> {email}
                  </p>
                </div>
                
                <div className="w-full grid grid-cols-2 gap-4 mt-4 bg-muted/30 p-4 rounded-xl ring-1 ring-black/5">
                  <div className="flex flex-col gap-1 items-center text-center">
                    <ShieldCheck size={20} className="text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Rol</span>
                    <span className="text-sm font-medium">Administrador</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center text-center">
                    <MapPin size={20} className="text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Sede</span>
                    <span className="text-sm font-medium">Central</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
        <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
          {sections[activeItem]}
        </main>
      </div>
    </div>
  );
}
