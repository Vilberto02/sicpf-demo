import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Package,
  ShoppingCart,
  TrendingDown,
  TriangleAlert,
  User,
  ChevronLeft,
  Mail,
  Phone,
  CalendarDays,
  ReceiptText,
  ChevronRight,
  UserRoundCog,
} from "lucide-react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { CardDashboard } from "../CardDashboard";
import { DoughnutChart } from "../charts/DougnutChart";
import { BarChart } from "../charts/BarChart";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/features/auth/store";
import { useDashboardStore } from "@/features/dashboard/store";
import { useInventoryStore } from "@/features/inventory/store";
import { useSalesStore } from "@/features/sales/store";
import { useAlertsStore } from "@/features/alerts/store";
import { useUsersStore } from "@/features/users/store";
import { AnimatedCounter } from "../AnimatedCounter";

type EditFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sede: string;
};

function ProfileSectionSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl flex sm:items-center flex-col sm:flex-row gap-6 p-6 w-full min-w-0">
          <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-40 mt-2" />
          </div>
        </div>
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 w-full min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl p-5 flex items-center gap-4 h-full">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full p-5 min-w-0">
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full p-5 min-w-0">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSection() {
  const {
    userProfile,
    isCheckingAuth,
    editProfile,
  } = useAuthStore();
  const { chartData, fetchChartData, loading: chartLoading } = useDashboardStore();

  const {
    categories,
    fetchCategories,
    stats: invStats,
    fetchStats: fetchInvStats,
  } = useInventoryStore();
  const {
    stats: salesStats,
    fetchStats: fetchSalesStats,
    myStats,
    fetchMyStats,
    loading: salesLoading,
  } = useSalesStore();
  const { stats: alertsStats, fetchStats: fetchAlertsStats } = useAlertsStore();
  const { sedes, fetchSedes } = useUsersStore();

  const [isDetailView, setIsDetailView] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    sede: "",
  });

  useEffect(() => {
    fetchChartData();
    fetchCategories();
    fetchInvStats();
    fetchSalesStats();
    fetchAlertsStats();
    fetchMyStats();
    fetchSedes();
  }, [fetchChartData, fetchCategories, fetchInvStats, fetchSalesStats, fetchAlertsStats, fetchMyStats, fetchSedes]);

  const name = userProfile?.first_name || "Cargando...";
  const lastname = userProfile?.last_name || "";
  const location = userProfile?.location || "Cargando...";
  const employeeId = userProfile?.employee_id || "Cargando...";
  const email = userProfile?.email || "usuario@ejemplo.com";
  const phone = userProfile?.phone || "No registrado";
  const dateJoined = userProfile?.date_joined || "Reciente";
  const role = userProfile?.role || "Usuario";

  const isAdminUser = role === "Administrador" || role === "Superusuario";

  if (isCheckingAuth || chartLoading || salesLoading || !userProfile) {
    return <ProfileSectionSkeleton />;
  }

  const openEditDialog = () => {
    setEditForm({
      first_name: userProfile.first_name ?? "",
      last_name: userProfile.last_name ?? "",
      email: userProfile.email ?? "",
      phone: userProfile.phone === "No registrado" ? "" : userProfile.phone ?? "",
      sede: userProfile.sede ? String(userProfile.sede) : "",
    });
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await editProfile({
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      sede: editForm.sede ? Number(editForm.sede) : null,
    });
    if (ok) {
      toast.success("Perfil actualizado correctamente.");
      setIsEditOpen(false);
    } else {
      toast.error("No se pudo actualizar el perfil.");
    }
  };

  const colors = [
    "#DBAEFF",
    "#D0E8FF",
    "#FBE38E",
    "#A9F4D0",
    "#FFB6C1",
    "#98FB98",
    "#FFDAB9",
    "#E6E6FA",
  ];

  if (isDetailView) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex gap-4 items-center border-b border-border pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDetailView(false)}
            className="cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
          </Button>
          <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
            <User width={36} height={36}></User>
            <h3 className="mt-1">Mis datos</h3>
          </div>
        </div>

        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl flex flex-col md:flex-row gap-10 p-8 w-full min-w-0">
          <div className="flex flex-col items-center gap-4 border-r border-border md:pr-10">
            <div className="bg-primary/10 flex justify-center items-center text-5xl font-semibold text-primary w-48 h-48 aspect-square rounded-full">
              {name.charAt(0) + lastname.charAt(0)}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">
                {name} {lastname}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{role}</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 content-start">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <Mail size={16} /> Correo Electrónico
              </p>
              <p className="text-base font-medium">{email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <Phone size={16} /> Teléfono
              </p>
              <p className="text-base font-medium">{phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <CalendarDays size={16} /> Fecha de Ingreso
              </p>
              <p className="text-base font-medium">{dateJoined}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <User size={16} /> ID Empleado
              </p>
              <p className="text-base font-medium">{employeeId}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Sede Asignada
              </p>
              <p className="text-base font-medium">{location}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <User width={36} height={36}></User>
          <h3 className="mt-1">Mi Perfil</h3>
        </div>
        <Button className="cursor-pointer gap-2" onClick={openEditDialog}>
          <UserRoundCog /> Editar perfil
        </Button>
      </div>
      <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          onClick={() => setIsDetailView(true)}
          className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl flex sm:items-center flex-col sm:flex-row gap-6 p-6 w-full min-w-0 cursor-pointer hover:bg-muted/50 transition-colors group"
        >
          <div className="bg-primary/10 flex justify-center items-center p-0.5 text-3xl font-semibold text-primary w-32 h-32 md:w-40 md:h-40 aspect-square rounded-full transition-transform group-hover:scale-105">
            {name.charAt(0) + lastname.charAt(0)}
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="font-semibold text-2xl group-hover:text-primary transition-colors">
              {name} {lastname}
            </h5>
            <p className="font-normal text-muted-foreground">{role}</p>
            <p className="font-normal text-muted-foreground">{location}</p>
            <div className="mt-1 inline-flex items-center text-xs text-primary font-medium">
              Ver detalles <ChevronRight size={15} />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 w-full min-w-0">
          {isAdminUser ? (
            <>
              <CardDashboard
                title="Pedidos procesados"
                value={<AnimatedCounter value={salesStats?.total_orders ?? 0} />}
                Icon={ShoppingCart}
                variant="default"
              ></CardDashboard>
              <CardDashboard
                title="Productos ingresados"
                value={<AnimatedCounter value={invStats?.total_products ?? 0} />}
                Icon={Package}
                variant="info"
              ></CardDashboard>
              <CardDashboard
                title="Productos en riesgo"
                value={<AnimatedCounter value={alertsStats?.at_risk ?? 0} />}
                Icon={TriangleAlert}
                variant="danger"
              ></CardDashboard>
              <CardDashboard
                title="Quiebres estimados"
                value={<AnimatedCounter value={alertsStats?.quiebres_estimados ?? 0} />}
                Icon={TrendingDown}
                variant="success"
              ></CardDashboard>
            </>
          ) : (
            <>
              <CardDashboard
                title="Mis ventas del mes"
                value={<AnimatedCounter value={myStats?.month_orders ?? 0} />}
                Icon={ShoppingCart}
                variant="default"
              ></CardDashboard>
              <CardDashboard
                title="Mi facturación del mes"
                value={
                  <span className="text-2xl tabular-nums">
                    S/{" "}
                    <AnimatedCounter
                      value={myStats?.month_revenue ?? 0}
                      isFloat
                    />
                  </span>
                }
                Icon={ReceiptText}
                variant="info"
              ></CardDashboard>
              <CardDashboard
                title="Pedidos completados"
                value={<AnimatedCounter value={myStats?.completed_orders ?? 0} />}
                Icon={Package}
                variant="success"
              ></CardDashboard>
              <CardDashboard
                title="Pedidos totales"
                value={<AnimatedCounter value={myStats?.total_orders ?? 0} />}
                Icon={TrendingDown}
                variant="warning"
              ></CardDashboard>
            </>
          )}
        </div>

        {isAdminUser ? (
          <>
            <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full p-5 min-w-0">
              <DoughnutChart
                colors={colors.slice(0, categories?.labels?.length || 4)}
                values={categories?.values ?? []}
                labels={categories?.labels ?? []}
              ></DoughnutChart>
            </div>
            <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full p-5 min-w-0">
              <BarChart
                dataset01={chartData?.dataset01 ?? []}
                dataset02={chartData?.dataset02 ?? []}
                label={chartData?.labels ?? []}
              ></BarChart>
            </div>
          </>
        ) : (
          <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full p-5 min-w-0 flex flex-col gap-4">
            <h4 className="font-semibold text-neutral-600">Mis últimas ventas</h4>
            <div className="flex flex-col divide-y divide-border">
              {(myStats?.recent_sales ?? []).map((venta: { id?: number; cliente_nombre?: string; codigo?: string; fecha?: string; estado?: string; total?: string | number }) => (
                <div key={venta.id} className="flex items-center justify-between py-3 px-1">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{venta.cliente_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {venta.codigo} · {venta.fecha?.slice(0, 10)} · {venta.estado}
                    </p>
                  </div>
                  <span className="font-semibold text-primary tabular-nums shrink-0 ml-4">
                    S/{Number(venta.total).toFixed(2)}
                  </span>
                </div>
              ))}
              {(myStats?.recent_sales ?? []).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aún no registras ventas.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  required
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={editForm.phone}
                  placeholder="Ej. 999888777"
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sede</Label>
                <Select
                  value={editForm.sede || "none"}
                  onValueChange={(sede) =>
                    setEditForm({ ...editForm, sede: sede === "none" ? "" : sede })
                  }
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Selecciona una sede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin sede</SelectItem>
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={String(sede.id)}>
                        {sede.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PasswordChangeSection onDone={() => setIsEditOpen(false)} />

            <DialogFooter>
              <Button type="submit" className="cursor-pointer">
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PasswordChangeSection({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const { changeOwnPassword, logoutUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Completa los tres campos para cambiar la contraseña.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    try {
      const result = await changeOwnPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (result.logoutRequired) {
        toast.success("Contraseña actualizada. Inicia sesión nuevamente.");
        logoutUser();
        navigate("/login");
      } else {
        toast.success("Contraseña actualizada correctamente.");
        onDone();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.");
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        Cambiar contraseña
      </p>
      <Input
        type="password"
        placeholder="Contraseña actual"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="cursor-pointer self-start"
        onClick={handleChangePassword}
      >
        Actualizar contraseña
      </Button>
    </div>
  );
}
