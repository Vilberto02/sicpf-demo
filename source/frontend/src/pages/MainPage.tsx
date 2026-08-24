import { AlertSection } from "@/components/sections/AlertSection";
import { InventorySection } from "@/components/sections/InventorySection";
import { OverviewSection } from "@/components/sections/OverviewSection";
import { ProductSection } from "@/components/sections/ProductSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { SaleSection } from "@/components/sections/SaleSection";
import { NewSaleSection } from "@/components/sections/NewSaleSection";
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
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store";
import { Navigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
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

function MainPageSkeleton() {
  return (
    <div className="flex w-screen h-screen bg-background">
      {/* Sidebar Skeleton */}
      <div className="w-64 h-full bg-card border-r border-border p-6 flex flex-col gap-6">
        <Skeleton className="h-10 w-32" />
        <div className="flex flex-col gap-2 mt-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      {/* Main Content Skeleton */}
      <div className="flex-1 p-6 md:p-10 flex flex-col gap-8 overflow-hidden">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="flex-1 rounded-xl min-h-[300px]" />
      </div>
    </div>
  );
}

export function MainPage() {
  const [activeItem, setActiveItem] = useState("general");
  const [isSidebarOpen, setIsSiderOpen] = useState(true);
  const { isAuthenticated, isCheckingAuth, fetchProfile, userProfile } = useAuthStore();

  const sections: Record<string, React.ReactNode> = {
    general: <OverviewSection />,
    inventario: (
      <InventorySection onViewProducts={() => setActiveItem("productos")} />
    ),
    productos: <ProductSection onBack={() => setActiveItem("inventario")} />,
    ventas: <SaleSection onNewSale={() => setActiveItem("nueva_venta")} />,
    alertas: <AlertSection />,
    perfil: <ProfileSection />,
    nueva_venta: <NewSaleSection onBack={() => setActiveItem("ventas")} />,
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isCheckingAuth) {
    return <MainPageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const name = userProfile?.first_name || "Cargando...";
  const lastname = userProfile?.last_name || "";
  const email = userProfile?.email || "usuario@ejemplo.com";

  const toggleSidebar = () => {
    setIsSiderOpen(!isSidebarOpen);
  };

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
