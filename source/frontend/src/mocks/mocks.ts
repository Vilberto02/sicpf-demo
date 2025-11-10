import type { LevelType, StateType } from "@/components/InventoryItem";

export const recommendations: { id: string, title: string; description: string }[] = [
  {
    id: "01",
    title: "Producto próximo a vencer",
    description: "Ibuprofeno 400mg vence en 20 días.",
  },
  {
    id: "02",
    title: "Caducidad múltiple",
    description: "Múltiples lotes de Metformina próximos a vencer.",
  },
  {
    id: "03",
    title: "Demanda estacional detectada",
    description: "Ventas de antigripales aumentaron 35%.",
  },
  {
    id: "04",
    title: "Producto con baja rotación",
    description: "Multivitamínico B Complex con ventas reducidas.",
  },
  {
    id: "05",
    title: "Rebastecimiento urgente",
    description: "Stock bajo de Amoxicilina 500mg.",
  },
];

export const productRisk: { id: string; title: string; level: LevelType }[] = [
  {
    id: "01",
    title: "Paracetamol 500g",
    level: "high",
  },
  {
    id: "02",
    title: "Panadol antigripal",
    level: "low",
  },
  {
    id: "03",
    title: "Ceterizina",
    level: "medium",
  },
  {
    id: "04",
    title: "Jarabe bebe",
    level: "high",
  },
];

export const productStatus: {
  code: string;
  title: string;
  state: StateType;
}[] = [
  {
    code: "MED001",
    title: "Paracetamol 500g",
    state: "active",
  },
  {
    code: "MED002",
    title: "Panadol antigripal",
    state: "defeated",
  },
  {
    code: "MED003",
    title: "Ceterizina",
    state: "to be defeated",
  },
  {
    code: "MED004",
    title: "Jarabe bebe",
    state: "defeated",
  },
];