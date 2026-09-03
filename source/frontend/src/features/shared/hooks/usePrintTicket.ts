import { useCallback } from "react";
import type { SaleItemType } from "@/features/sales/types";
import type { VentaDetalleType } from "@/types";

export function usePrintTicket() {
  const printTicket = useCallback((row: SaleItemType) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    let filasHTML = "";
    if (row.detalles) {
      row.detalles.forEach((d: VentaDetalleType) => {
        let qty = 0;
        let type = "";
        let total = 0;
        if (d.cantidad_real > 0) {
          qty = d.cantidad_real;
          type = "Cj";
          total = d.cantidad_real * d.precio_real;
        } else if (d.cantidad_blister > 0) {
          qty = d.cantidad_blister;
          type = "Bl";
          total = d.cantidad_blister * d.precio_blister;
        } else if (d.cantidad_flotante > 0) {
          qty = d.cantidad_flotante;
          type = "Und";
          total = d.cantidad_flotante * d.precio_flotante;
        }

        if (qty > 0) {
          filasHTML += `<tr>
             <td>${qty} ${type}</td>
             <td>${d.producto_nombre?.substring(0, 15) || "Producto"}</td>
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
             Cliente: ${row.cliente_nombre || "Cliente General"}
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
             Atendido por: ${row.vendedor_nombre || "Vendedor"}<br/>
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
  }, []);

  return { printTicket };
}