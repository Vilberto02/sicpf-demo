import { useEffect } from "react";
import { Package, ShoppingCart, Sparkles, TriangleAlert, User } from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";
import { DoughnutChart } from "../charts/DougnutChart";
import { BarChart } from "../charts/BarChart";
import { useAuthStore } from "@/features/auth/store";
import { useDashboardStore } from "@/features/dashboard/store";
import { useInventoryStore } from "@/features/inventory/store";
import { useSalesStore } from "@/features/sales/store";
import { useAlertsStore } from "@/features/alerts/store";

export function ProfileSection(){
  const { userProfile, fetchProfile } = useAuthStore();
  const { chartData, fetchChartData } = useDashboardStore();
  const { categories, fetchCategories, stats: invStats, fetchStats: fetchInvStats } = useInventoryStore();
  const { stats: salesStats, fetchStats: fetchSalesStats } = useSalesStore();
  const { stats: alertsStats, fetchStats: fetchAlertsStats } = useAlertsStore();

  useEffect(() => {
    fetchProfile();
    fetchChartData();
    fetchCategories();
    fetchInvStats();
    fetchSalesStats();
    fetchAlertsStats();
  }, [fetchProfile, fetchChartData, fetchCategories, fetchInvStats, fetchSalesStats, fetchAlertsStats]);

  const name = userProfile?.first_name || "Cargando...";
  const lastname = userProfile?.last_name || "";
  const role = userProfile?.role || "Cargando...";
  const location = userProfile?.location || "Cargando...";
  const employeeId = userProfile?.employee_id || "Cargando...";

  const colors = ["#DBAEFF", "#D0E8FF", "#FBE38E", "#A9F4D0", "#FFB6C1", "#98FB98", "#FFDAB9", "#E6E6FA"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
        <User width={42} height={42}></User>
        <h3>Mi Perfil</h3>
      </div>
      <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarjeta del perfil */}
        <div className="border-neutral-400 border-2 rounded-2xl flex sm:items-center flex-col sm:flex-row gap-6 p-6 w-full">
          <div className="bg-neutral-300 flex justify-center items-center p-0.5 text-3xl font-semibold text-primary w-32 h-32 md:w-40 md:h-40 aspect-square rounded-full">
            {name.charAt(0) + lastname.charAt(0)}
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="font-semibold text-2xl">
              {name} {lastname}
            </h5>
            <p className="font-normal text-neutral-500">{role}</p>
            <p className="font-normal text-neutral-500">{location}</p>
            <Button variant={"outline"}>ID: {employeeId}</Button>
          </div>
        </div>


        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 w-full">
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
        <div className="border-2 rounded-2xl border-neutral-400 w-full p-4">
          <DoughnutChart
            colors={colors.slice(0, categories?.labels?.length || 4)}
            values={categories?.values ?? []}
            labels={categories?.labels ?? []}
          ></DoughnutChart>
        </div>
        <div className="border-2 rounded-2xl border-neutral-400 w-full p-4">
          <BarChart dataset01={chartData?.dataset01 ?? []} dataset02={chartData?.dataset02 ?? []} label={chartData?.labels ?? []} ></BarChart>
        </div>
      </div>
    </div>
  );
}