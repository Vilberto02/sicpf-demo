import { useEffect, useState } from "react";
import {
  User,
  ChevronLeft,
  Mail,
  Phone,
  CalendarDays,
  ChevronRight,
  UserRoundCog,
  KeyRound,
} from "lucide-react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useAuthStore } from "@/features/auth/store";
import { useDashboardStore } from "@/features/dashboard/store";
import { useInventoryStore } from "@/features/inventory/store";
import { useSalesStore } from "@/features/sales/store";
import { useAlertsStore } from "@/features/alerts/store";
import { useUsersStore } from "@/features/users/store";
import { ProfileDashboard } from "./ProfileDashboard";
import { ProfileEditDialog } from "./ProfileEditDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

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
  const { userProfile, isCheckingAuth } = useAuthStore();
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
  const { fetchSedes } = useUsersStore();

  const [isDetailView, setIsDetailView] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

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
      <div className="flex gap-3 items-center justify-between flex-wrap">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <User width={36} height={36}></User>
          <h3 className="mt-1">Mi Perfil</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="cursor-pointer gap-2"
            onClick={() => setIsPasswordOpen(true)}
          >
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </Button>
          <Button className="cursor-pointer gap-2" onClick={() => setIsEditOpen(true)}>
            <UserRoundCog /> Editar perfil
          </Button>
        </div>
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

        <ProfileDashboard
          isAdminUser={isAdminUser}
          salesStats={salesStats}
          invStats={invStats}
          alertsStats={alertsStats}
          myStats={myStats}
          categories={categories}
          chartData={chartData}
        />
      </div>

      {userProfile && (
        <ProfileEditDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          userProfile={userProfile}
          onOpenPassword={() => setIsPasswordOpen(true)}
        />
      )}

      <ChangePasswordDialog
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
      />
    </div>
  );
}