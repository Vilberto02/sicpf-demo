import { apiClient } from "@/lib/apiClient";
import type { DashboardChartType } from "@/features/shared/statsTypes";

export const getDashboardChartData = () => apiClient<DashboardChartType>("/dashboard/chart/");
