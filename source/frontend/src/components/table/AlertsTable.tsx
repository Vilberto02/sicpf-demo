import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import type { AlertItemType } from "@/types";
import { alertsData } from "@/mocks";


export function AlertsTable(){
  
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
  const handleBlock = (row: any) => {
    console.log("Block item:", row);
  };

  return (
    <DataTable
      columns={alertsColumns}
      data={alertsData}
      searchPlaceholder="Buscar por producto"
      categories={["Todos", "Medicamento", "Antinflamatorio", "Jarabe"]}
      statusHeaderProps="N. Riesgo"
      onView={handleView}
      onEdit={handleEdit}
      onBlock={handleBlock}
    />
  );
}