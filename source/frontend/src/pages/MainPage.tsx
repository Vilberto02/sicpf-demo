import { SideBar } from "@/components/sidebar/SideBar";
import type { SideBarItemType } from "@/types";
import {
  Menu,
  ChartNoAxesColumnDecreasing,
  Box,
  ShoppingCart,
  Siren,
  User,
  UserCircle2,
  Mail,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { useState, Suspense } from "react";
import { useAuthStore } from "@/features/auth/store";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
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
  {
    id: "inventario",
    name: "Inventario",
    Icon: Box,
    children: [
      { id: "inventario", name: "Lotes" },
      { id: "productos", name: "Productos" },
    ],
  },
  {
    id: "ventas",
    name: "Ventas",
    Icon: ShoppingCart,
    children: [
      { id: "ventas", name: "Historial de ventas" },
      { id: "nueva_venta", name: "Nueva venta" },
    ],
  },
  { id: "alertas", name: "Alertas", Icon: Siren },
  { id: "perfil", name: "Perfil", Icon: User },
];

export function MainPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const userProfile = useAuthStore((s) => s.userProfile);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminUser =
    userProfile?.role === "Administrador" || userProfile?.role === "Superusuario";

  const pathToId: Record<string, string> = {
    "/": "general",
    "/general": "general",
    "/inventario": "inventario",
    "/productos": "productos",
    "/ventas": "ventas",
    "/ventas/nueva": "nueva_venta",
    "/alertas": "alertas",
    "/perfil": "perfil",
    "/usuarios": "usuarios",
  };

  const activeItem = pathToId[location.pathname] || "general";

  const handleSelectItem = (id: string) => {
    const idToPath: Record<string, string> = {
      general: "/general",
      inventario: "/inventario",
      productos: "/productos",
      ventas: "/ventas",
      nueva_venta: "/ventas/nueva",
      alertas: "/alertas",
      perfil: "/perfil",
      usuarios: "/usuarios",
    };
    const target = idToPath[id] || "/general";
    navigate(target);
  };

  const navItems: SideBarItemType[] = isAdminUser
    ? [...sidebarItems, { id: "usuarios", name: "Usuarios", Icon: ShieldCheck }]
    : sidebarItems;

  const name = userProfile?.first_name || "Cargando...";
  const lastname = userProfile?.last_name || "";
  const email = userProfile?.email || "usuario@ejemplo.com";

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex w-screen h-screen">
      <SideBar
        items={navItems}
        activeItem={activeItem}
        setActiveItem={handleSelectItem}
        isOpen={isSidebarOpen}
      />
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"}`}
      >
        <div className="flex items-center justify-between px-4 py-6 gap-6">
          <Menu
            className="cursor-pointer select-none"
            onClick={toggleSidebar}
          />
          
          <Dialog>
            <DialogTrigger asChild>
              <div className="flex items-center gap-4 cursor-pointer hover:bg-stone-100 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="text-primary" />
                  <p className="select-none line-clamp-1 md:line-clamp-0 font-medium text-sm">
                    {name}, {lastname}
                  </p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card ring-1 ring-black/5 shadow-xl rounded-2xl border-0">
              <DialogHeader>
                <DialogTitle className="text-2xl text-primary font-semibold tracking-tight text-center mt-4">
                  Credencial del usuario
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
                    <span className="text-sm font-medium">{userProfile?.role || "Usuario"}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center text-center">
                    <MapPin size={20} className="text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Sede</span>
                    <span className="text-sm font-medium">{userProfile?.location || "Sede Central"}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
        <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
