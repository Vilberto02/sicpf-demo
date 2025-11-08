// pages/ProductosTable.tsx
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { ListFilter } from "lucide-react";

interface Producto {
  codigo: string;
  nombre: string;
  stockFlotante: number;
  stockReal: number;
  lote: string;
  vencimiento: string;
  estado: "Activo" | "Por vencer" | "Vencido";
}

const columns: ColumnDef<Producto>[] = [
  { accessorKey: "codigo", header: "Código" },
  { accessorKey: "nombre", header: "Nombre" },
  { accessorKey: "stockFlotante", header: "S. Flotante" },
  { accessorKey: "stockReal", header: "S. Real" },
  { accessorKey: "lote", header: "Lote" },
  { accessorKey: "vencimiento", header: "Vencimiento" },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ getValue }) => {
      const estado = getValue() as Producto["estado"];
      const color =
        estado === "Activo"
          ? "text-green-700 bg-green-50 border-green-200"
          : estado === "Por vencer"
          ? "text-yellow-700 bg-yellow-50 border-yellow-200"
          : "text-red-700 bg-red-50 border-red-200";
      return (
        <span
          className={`border px-2 py-1 rounded text-sm font-medium ${color}`}
        >
          {estado}
        </span>
      );
    },
  },
];

const data: Producto[] = [
  {
    codigo: "MED001",
    nombre: "Paracetamol 500mg",
    stockFlotante: 1500,
    stockReal: 1450,
    lote: "LOT2025A",
    vencimiento: "2025-02-24",
    estado: "Activo",
  },
];

export default function InventoryTable() {
  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Buscar por nombre"
            className="min-w-[216px]"
          ></Input>
          <Select>
            <SelectTrigger className="w-md">
              <SelectValue placeholder="Selecciona una categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-category">Todas las categorias</SelectItem>
              <SelectItem value="analgesico">Analgesico</SelectItem>
              <SelectItem value="antinflamatorio">Antinflamatorios</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <ListFilter></ListFilter> Filtrar
        </Button>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
