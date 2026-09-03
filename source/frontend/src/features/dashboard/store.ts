import { create } from "zustand";
import type { DashboardChartType } from "@/features/shared/statsTypes";
import { getErrorMessage } from "@/features/shared/errorUtils";
import { getDashboardChartData } from "./api";

interface DashboardState {
  chartData: DashboardChartType | null;
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
    } catch (error) {
      console.error(getErrorMessage(error));
      set({ loading: false });
    }
  }
}));
