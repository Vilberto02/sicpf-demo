import type { LevelType, StateType } from "@/components/InventoryItem";
import type { AlertItemType, InventoryItemType, SaleItemType } from "@/types";

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


export const inventoryData: InventoryItemType[] = [
  {
    id: "1",
    codigo: "PROD-001",
    nombre: "Paracetamol 500mg",
    stockFlotante: 150,
    stockReal: 145,
    lote: "L2024001",
    vencimiento: "2025-12-31",
    status: "Activo",
    categoria: "Medicamentos",
  },
  {
    id: "2",
    codigo: "PROD-002",
    nombre: "Ibuprofeno 400mg",
    stockFlotante: 80,
    stockReal: 78,
    lote: "L2024002",
    vencimiento: "2025-06-15",
    status: "Por vencer",
    categoria: "Medicamentos",
  },
  {
    id: "3",
    codigo: "PROD-003",
    nombre: "Amoxicilina 500mg",
    stockFlotante: 200,
    stockReal: 195,
    lote: "L2023003",
    vencimiento: "2024-01-20",
    status: "Vencido",
    categoria: "Antibióticos",
  },
  {
    id: "4",
    codigo: "PROD-004",
    nombre: "Loratadina 10mg",
    stockFlotante: 120,
    stockReal: 120,
    lote: "L2024004",
    vencimiento: "2025-08-30",
    status: "Activo",
    categoria: "Antihistamínicos",
  },
];


export const salesData: SaleItemType[] = [
  {
    id: "1",
    codigo: "PED-001",
    cliente: "Juan Pérez",
    monto: 125.5,
    fecha: "2024-01-15",
    status: "Completado",
    vendedor: "María García",
  },
  {
    id: "2",
    codigo: "PED-002",
    cliente: "Carlos Rodríguez",
    monto: 89.75,
    fecha: "2024-01-14",
    status: "Pendiente",
    vendedor: "Ana Martínez",
  },
  {
    id: "3",
    codigo: "PED-003",
    cliente: "Laura Sánchez",
    monto: 234.0,
    fecha: "2024-01-13",
    status: "Cancelado",
    vendedor: "María García",
  },
];


// Sample alerts data
export const alertsData: AlertItemType[] = [
  {
    id: "1",
    producto: "Ceterizina",
    categoria: "Medicamento",
    stockActual: 85,
    stockMinimo: 2,
    fecha: "2024-01-15",
    periodoAgotamiento: "2 días",
    tendenciaConsumo: "Alta",
    status: "Alto",
  },
  {
    id: "2",
    producto: "Paracetamol 500g",
    categoria: "Antinflamatorio",
    stockActual: 85,
    stockMinimo: 2,
    fecha: "2024-01-14",
    periodoAgotamiento: "2 días",
    tendenciaConsumo: "Moderada",
    status: "Medio",
  },
  {
    id: "3",
    producto: "Jarabe",
    categoria: "Jarabe",
    stockActual: 85,
    stockMinimo: 2,
    fecha: "2024-01-13",
    periodoAgotamiento: "2 días",
    tendenciaConsumo: "Baja",
    status: "Bajo",
  },
];