export type AlertItemType = {
  id?: number;
  producto: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  fecha: string;
  periodo_agotamiento: string;
  tendencia_consumo: "Alta" | "Moderada" | "Baja";
  status: "Alto" | "Medio" | "Bajo";
};
