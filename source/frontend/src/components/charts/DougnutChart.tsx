import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { type DoughnutChartProps } from "@/types/index";
import { ScrollArea } from "../ui/scroll-area";

ChartJS.register(ArcElement, Tooltip, Legend);

ChartJS.defaults.font.family = "'Sora', sans-serif";
ChartJS.defaults.color = "#78716c";

export function DoughnutChart({ labels, values, colors }: DoughnutChartProps) {
  if (!labels || labels.length === 0) {
    return (
      <div className="py-6 px-8 w-full h-full flex flex-col items-center justify-center min-h-[300px]">
        <h3 className="font-semibold text-center text-lg mb-2 text-foreground">
          Ventas por categoría de producto.
        </h3>
        <p className="text-muted-foreground text-sm">
          No hay operaciones registradas en los últimos meses.
        </p>
      </div>
    );
  }

  // Dataset y opciones ajustadas para replicar el estilo del diseño.
  const total = values.reduce((sum, cur) => sum + cur, 0);
  const data = {
    labels: labels,
    datasets: [
      {
        label: "DoughnutChart",
        data: values,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map((c) => c + "dd"), // slightly transparent on hover
        spacing: 0,
        hoverOffset: 4,
        borderColor: "#ffffff", // clean white borders
        borderWidth: 2,
        borderRadius: 0,
        cutout: "60%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
    cutoutPercentage: 60,
  };

  return (
    <div className="relative w-full py-6 px-2 md:px-8">
      <h3 className="font-semibold text-center text-lg mb-8 text-foreground">
        Ventas por categoría de producto.
      </h3>

      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
        <ScrollArea className="w-full lg:w-1/2 max-h-[260px]">
          <div className="space-y-4 pr-4">
            {labels.map((label, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="min-w-[16px] min-h-[16px] w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  ></span>
                  <span className="text-sm font-medium text-neutral-700 leading-tight">{label}</span>
                </div>
                <span className="text-stone-500 text-sm font-semibold">{values[index]}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-center items-center w-full lg:w-1/2">
          <div className="relative w-full max-w-[240px] aspect-square drop-shadow-sm">
            <Doughnut data={data} options={options}></Doughnut>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-xs text-neutral-500 font-medium">Productos</p>
              <p className="text-xl font-bold text-foreground">{total}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
