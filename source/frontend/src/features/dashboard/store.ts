import { create } from "zustand";
import { getDashboardChartData } from "./api";

interface DashboardState {
  chartData: any | null;
  fetchChartData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  chartData: null,
  fetchChartData: async () => {
    try {
      const data = await getDashboardChartData();
      set({ chartData: data });
    } catch (error: any) {
      console.error(error);
    }
  }
}));
