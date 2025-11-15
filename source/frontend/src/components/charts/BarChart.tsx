import type { BarChartProps } from "@/types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function BarChart({dataset01, dataset02, label}: BarChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const labels = label;

  const data = {
    labels,
    datasets: [
      {
        label: "Ventas",
        data: labels.map((_, index) => dataset01[index]),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
      {
        label: "Compras",
        data: labels.map((_, index) => dataset02[index]),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  return (
    <div className="py-6 px-8 w-full">
      <h3 className="font-semibold text-center text-lg mb-6">
        Ventas y compras por meses.
      </h3>
      <div className="h-64 w-full">
        <Bar options={options} data={data} style={{ height: "100%" }} />
      </div>
    </div>
  );
}
