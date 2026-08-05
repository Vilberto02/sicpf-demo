import { apiClient } from "@/lib/apiClient";

export const getDashboardChartData = () => apiClient<any>("/dashboard/chart/");
