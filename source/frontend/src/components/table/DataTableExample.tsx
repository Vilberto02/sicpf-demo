import type { AlertItemType, InventoryItemType, SaleItemType } from "@/types";
import { DataTable } from "./DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { alertsData, inventoryData, salesData } from "@/mocks";

/*

PRUEBA DE TABLAS DE LAS DIFERENTES SECCIONES DEL DASHBOARD.

*/

const inventoryColumns: ColumnDef<InventoryItemType>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "stockFlotante",
    header: "S. Flotante",
  },
  {
    accessorKey: "stockReal",
    header: "S. Real",
  },
  {
    accessorKey: "lote",
    header: "Lote",
  },
  {
    accessorKey: "vencimiento",
    header: "Vencimiento",
  },
];

const salesColumns: ColumnDef<SaleItemType>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
  },
  {
    accessorKey: "monto",
    header: "Monto",
    cell: ({ row }) => `$${row.getValue("monto")}`,
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
  },
  {
    accessorKey: "vendedor",
    header: "Vendedor",
  },
];

const alertsColumns: ColumnDef<AlertItemType>[] = [
  {
    accessorKey: "producto",
    header: "Producto",
  },
  {
    accessorKey: "categoria",
    header: "Categoria",
  },
  {
    accessorKey: "stockActual",
    header: "Stock Actual",
  },
  {
    accessorKey: "stockMinimo",
    header: "Stock Minimo",
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
  },

  {
    accessorKey: "periodoAgotamiento",
    header: "P. Agotamiento",
  },
  {
    accessorKey: "tendenciaConsumo",
    header: "T. Consumo",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleView = (row: any) => {
  console.log("View item:", row);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleEdit = (row: any) => {
  console.log("Edit item:", row);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleFinance = (row: any) => {
  console.log("Finance item:", row);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleBlock = (row: any) => {
  console.log("Block item:", row);
};

export function DataTableExample() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Inventario</h2>
        <DataTable
          columns={inventoryColumns}
          data={inventoryData}
          searchPlaceholder="Buscar por nombre"
          categories={["Medicamentos", "Antibióticos", "Antihistamínicos"]}
          statusHeaderProps="Estado"
          onView={handleView}
          onEdit={handleEdit}
          onFinance={handleFinance}
          onBlock={handleBlock}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Ventas</h2>
        <DataTable
          columns={salesColumns}
          data={salesData}
          searchPlaceholder="Buscar por cliente"
          categories={["Completado", "Pendiente", "Cancelado"]}
          statusHeaderProps="Estado"
          onView={handleView}
          onEdit={handleEdit}
          onFinance={handleFinance}
          onBlock={handleBlock}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Alertas</h2>
        <DataTable
          columns={alertsColumns}
          data={alertsData}
          searchPlaceholder="Buscar por producto"
          categories={["Stock Bajo", "Vencimiento", "Pedido"]}
          statusHeaderProps="N. Riesgo"
          onView={handleView}
          onEdit={handleEdit}
          onBlock={handleBlock}
        />
      </div>
    </div>
  );
}