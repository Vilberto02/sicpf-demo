import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { type DoughnutChartProps } from "@/types/index";
import { ScrollArea } from "../ui/scroll-area";

ChartJS.register(ArcElement, Tooltip, Legend);

export function DoughnutChart({ labels, values, colors }: DoughnutChartProps) {
  // Dataset y opciones ajustadas para replicar el estilo del diseño.
  const total = values.reduce((sum, cur) => sum + cur, 0);
  const data = {
    labels: labels,
    datasets: [
      {
        label: "DoughnutChart",
        data: values,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map((c) => c + "aa"),
        spacing: 4,
        hoverOffset: 2,
        borderColor: ["transparent"],
        borderWidth: 0,
        borderRadius: 0,
        cutout: "55%",
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
    },
  };

  return (
    <div className="relative w-full py-6 px-8">
      <h3 className="font-semibold text-center text-lg mb-8">
        Ventas por categoría de producto.
      </h3>

      <div className="flex justify-between">
        <ScrollArea>
          <div className="space-y-2">
            {labels.map((label, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  ></span>
                  <span className="text-base text-neutral-700">{label}</span>
                </div>
                <span className="text-stone-400">{values[index]}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-center items-center">
          <div className="relative w-72 h-72 md:w-80 md:h-80">
            <Doughnut data={data} options={options}></Doughnut>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-sm text-neutral-500">Productos</p>
              <p className="text-xl font-semibold">{total}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
