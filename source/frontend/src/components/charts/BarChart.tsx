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

ChartJS.defaults.font.family = "'Sora', sans-serif";
ChartJS.defaults.color = "#78716c"; // text-stone-500

export function BarChart({dataset01, dataset02, label}: BarChartProps) {
  if (!label || label.length === 0) {
    return (
      <div className="py-6 px-8 w-full h-full flex flex-col items-center justify-center min-h-[250px]">
        <h3 className="font-semibold text-center text-lg mb-2 text-foreground">
          Ventas y compras por meses.
        </h3>
        <p className="text-muted-foreground text-sm">
          No hay operaciones registradas en los últimos meses.
        </p>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#1c1917",
        bodyColor: "#44403c",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
      },
      y: {
        border: { display: false },
        grid: { color: "#f5f5f4" }, // stone-100
        beginAtZero: true,
      }
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    }
  };

  const labels = label;

  const data = {
    labels,
    datasets: [
      {
        label: "Ventas",
        data: labels.map((_, index) => dataset01[index]),
        backgroundColor: "#0d9488", // teal-600
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Compras",
        data: labels.map((_, index) => dataset02[index]),
        backgroundColor: "#94a3b8", // slate-400
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="py-6 px-8 w-full">
      <h3 className="font-semibold text-center text-lg mb-6 text-foreground">
        Ventas y compras por meses.
      </h3>
      <div className="h-64 w-full">
        <Bar options={options} data={data} style={{ height: "100%" }} />
      </div>
    </div>
  );
}
