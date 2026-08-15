import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
  User,
  ArrowLeft,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";
import { DoughnutChart } from "../charts/DougnutChart";
import { BarChart } from "../charts/BarChart";
import { useAuthStore } from "@/features/auth/store";
import { useDashboardStore } from "@/features/dashboard/store";
import { useInventoryStore } from "@/features/inventory/store";
import { useSalesStore } from "@/features/sales/store";
import { useAlertsStore } from "@/features/alerts/store";

export function ProfileSection() {
  const { userProfile, fetchProfile } = useAuthStore();
  const { chartData, fetchChartData } = useDashboardStore();
  const {
    categories,
    fetchCategories,
    stats: invStats,
    fetchStats: fetchInvStats,
  } = useInventoryStore();
  const { stats: salesStats, fetchStats: fetchSalesStats } = useSalesStore();
  const { stats: alertsStats, fetchStats: fetchAlertsStats } = useAlertsStore();

  const [isDetailView, setIsDetailView] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchChartData();
    fetchCategories();
    fetchInvStats();
    fetchSalesStats();
    fetchAlertsStats();
  }, [
    fetchProfile,
    fetchChartData,
    fetchCategories,
    fetchInvStats,
    fetchSalesStats,
    fetchAlertsStats,
  ]);

  const name = userProfile?.first_name || "Cargando...";
  const lastname = userProfile?.last_name || "";
  const role = userProfile?.role || "Cargando...";
  const location = userProfile?.location || "Cargando...";
  const employeeId = userProfile?.employee_id || "Cargando...";
  const email = userProfile?.email || "usuario@ejemplo.com";
  const phone = userProfile?.phone || "No registrado";
  const dateJoined = userProfile?.date_joined || "Reciente";

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
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
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
      <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
        <User width={36} height={36}></User>
        <h3 className="mt-1">Mi Perfil</h3>
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
            {/*<p className="font-normal text-muted-foreground">{role}</p>*/}
            <p className="font-normal text-muted-foreground">{location}</p>
            <div className="mt-1 inline-flex items-center text-xs text-primary font-medium">
              Ver detalles completos &rarr;
            </div>
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 w-full min-w-0">
          <CardDashboard
            title="Pedidos procesados"
            value={salesStats?.total_orders ?? "0"}
            Icon={ShoppingCart}
            variant="default"
          ></CardDashboard>
          <CardDashboard
            title="Productos ingresados"
            value={invStats?.total_products ?? "0"}
            Icon={Package}
            variant="info"
          ></CardDashboard>
          <CardDashboard
            title="Productos en riesgo"
            value={alertsStats?.at_risk ?? "0"}
            Icon={TriangleAlert}
            variant="danger"
          ></CardDashboard>
          <CardDashboard
            title="Tendencia de consumo"
            value={alertsStats?.consumption_trend ?? "0 %"}
            Icon={Sparkles}
            variant="success"
          ></CardDashboard>
        </div>
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
      </div>
    </div>
  );
}
