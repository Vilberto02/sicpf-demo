import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import type { SaleItemType } from "@/features/sales/types";
import { useSalesStore } from "@/features/sales/store";
import { toast } from "sonner";
import { SaleDetailsModal } from "@/components/modals/SaleDetailsModal";

export function SalesTable() {
  const { items, fetchItems, loading, updateItem, fetchStats } = useSalesStore();
  const [selectedSale, setSelectedSale] = useState<SaleItemType | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <div>Cargando...</div>;

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      Cancelado: "bg-red-100 text-red-800 border-red-200",
      Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Completado: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[estado] || ""}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  // Sales columns
  const salesColumns: ColumnDef<SaleItemType>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
    {
      accessorKey: "cliente_nombre",
      header: "Cliente",
    },
    {
      accessorKey: "total",
      header: "Monto",
      cell: ({ row }) => `S/${Number(row.getValue("total")).toFixed(2)}`,
    },
    {
      accessorKey: "fecha",
      header: "Fecha y Hora",
      cell: ({ row }) => {
        const rawDate = row.getValue("fecha") as string;
        try {
          const date = new Date(rawDate);
          return new Intl.DateTimeFormat("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }).format(date);
        } catch {
          return rawDate;
        }
      }
    },
    {
      accessorKey: "vendedor_nombre",
      header: "Vendedor",
    },
    {
      id: "status",
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => getEstadoBadge(row.original.estado),
    }
  ];

  // Action handlers
  const handleView = (row: SaleItemType) => {
    setSelectedSale(row);
  };

  const handlePrint = (row: SaleItemType) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    let filasHTML = '';
    if (row.detalles) {
      row.detalles.forEach((d: any) => {
        let qty = 0;
        let type = '';
        let total = 0;
        if (d.cantidad_real > 0) { qty = d.cantidad_real; type = 'Cj'; total = d.cantidad_real * d.precio_real; }
        else if (d.cantidad_blister > 0) { qty = d.cantidad_blister; type = 'Bl'; total = d.cantidad_blister * d.precio_blister; }
        else if (d.cantidad_flotante > 0) { qty = d.cantidad_flotante; type = 'Und'; total = d.cantidad_flotante * d.precio_flotante; }
        
        if (qty > 0) {
           filasHTML += `<tr>
             <td>${qty} ${type}</td>
             <td>${d.producto_nombre?.substring(0, 15) || 'Producto'}</td>
             <td class="right">${total.toFixed(2)}</td>
           </tr>`;
        }
      });
    }

    const content = `
      <html>
        <head>
          <title>Ticket ${row.codigo}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: monospace; width: 75mm; padding: 5mm; margin: 0; font-size: 12px; color: black; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 2px 0; font-size: 11px; }
            .right { text-align: right; }
            .dashed { border-bottom: 1px dashed black; }
          </style>
        </head>
        <body>
           <div class="center bold" style="font-size: 16px">SICPF DEMO</div>
           <div class="center">
             Ticket: ${row.codigo}<br/>
             Fecha: ${row.fecha}<br/>
             Cliente: ${row.cliente_nombre || 'Cliente General'}
           </div>
           <table>
             <thead>
               <tr class="dashed">
                 <th>Cant</th>
                 <th>Prod</th>
                 <th class="right">Tot</th>
               </tr>
             </thead>
             <tbody>${filasHTML}</tbody>
           </table>
           <br/>
           <div style="display: flex; justify-content: space-between" class="bold dashed">
             <span>TOTAL:</span>
             <span>S/${Number(row.total).toFixed(2)}</span>
           </div>
           <br/>
           <div class="center">
             Atendido por: ${row.vendedor_nombre || 'Vendedor'}<br/>
             ¡Gracias por su compra!
           </div>
        </body>
      </html>
    `;
    
    if (iframe.contentWindow) {
      iframe.contentWindow.document.write(content);
      iframe.contentWindow.document.close();
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
    setTimeout(() => document.body.removeChild(iframe), 2000);
  };

  const handleBlock = async (row: SaleItemType) => {
    if (row.estado === "Cancelado") {
      toast.error("Esta venta ya ha sido anulada");
      return;
    }
    
    const { default: Swal } = await import('sweetalert2');
    
    const result = await Swal.fire({
       title: '¿Anular Venta?',
       text: `¿Estás seguro que deseas anular la venta ${row.codigo}? El stock de los productos será devuelto al inventario.`,
       icon: 'warning',
       showCancelButton: true,
       confirmButtonColor: '#d33',
       cancelButtonColor: '#3085d6',
       confirmButtonText: 'Sí, anular',
       cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
       try {
         await updateItem(row.id!, { estado: "Cancelado" });
         toast.success("Venta anulada y stock devuelto exitosamente");
         fetchItems();
         if (fetchStats) fetchStats();
       } catch(e: any) {
         toast.error("Hubo un error al anular la venta: " + (e.message || "Error desconocido"));
       }
    }
  };

  const sortedItems = [...items].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-4">
      <DataTable
        columns={salesColumns}
        data={sortedItems}
        searchPlaceholder="Buscar por cliente"
        categories={["Completado", "Pendiente", "Cancelado"]}
        statusHeaderProps="Estado"
        onView={handleView}
        onPrint={handlePrint}
        onBlock={handleBlock}
      />

      <SaleDetailsModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </div>
  );
}
