import { create } from "zustand";
import { getDashboardChartData } from "./api";

interface DashboardState {
  chartData: any | null;
  loading: boolean;
  fetchChartData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  chartData: null,
  loading: false,
  fetchChartData: async () => {
    set({ loading: true });
    try {
      const data = await getDashboardChartData();
      set({ chartData: data, loading: false });
    } catch (error: any) {
      console.error(error);
      set({ loading: false });
    }
  }
}));
