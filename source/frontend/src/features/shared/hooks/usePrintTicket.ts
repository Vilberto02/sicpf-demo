import { useCallback } from "react";
import type { SaleItemType } from "@/features/sales/types";
import type { VentaDetalleType } from "@/types";
import { formatDateTime } from "@/features/shared/dateUtils";

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
             <td>
               ${d.producto_nombre || "Producto"}
               ${d.lote_codigo ? `<br/><span style="font-size: 9px; color: #444;">Lt: ${d.lote_codigo}</span>` : ""}
             </td>
             <td class="right">S/ ${total.toFixed(2)}</td>
           </tr>`;
        }
      });
    }

    const totalNum = Number(row.total) || 0;
    const opGravada = row.op_gravada !== undefined && row.op_gravada !== null
      ? Number(row.op_gravada)
      : Number((totalNum / 1.18).toFixed(2));
    const igv = row.igv !== undefined && row.igv !== null
      ? Number(row.igv)
      : Number((totalNum - opGravada).toFixed(2));
    const subtotal = row.subtotal !== undefined && row.subtotal !== null
      ? Number(row.subtotal)
      : opGravada;

    const fechaDisplay = row.fecha ? formatDateTime(row.fecha) : "";
    const comprobanteTitle = row.tipo_comprobante_display?.toUpperCase() || 
      (row.tipo_comprobante === "factura" ? "FACTURA ELECTRÓNICA" : "BOLETA DE VENTA ELECTRÓNICA");

    const content = `
      <html>
        <head>
          <title>Comprobante ${row.codigo}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: monospace; width: 75mm; padding: 5mm; margin: 0; font-size: 12px; color: black; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { text-align: left; padding: 3px 0; font-size: 11px; vertical-align: top; }
            .right { text-align: right; }
            .dashed { border-bottom: 1px dashed black; }
            .totals-row { display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px; }
          </style>
        </head>
        <body>
           <div class="center bold" style="font-size: 15px">GESTIÓN FARMACÉUTICA</div>
           <div class="center bold" style="font-size: 12px; margin-top: 2px;">${comprobanteTitle}</div>
           <div class="center" style="margin-top: 4px;">
             N°: ${row.codigo}<br/>
             Fecha: ${fechaDisplay}<br/>
             Cliente: ${row.cliente_nombre || "CLIENTE GENERAL"}${row.cliente_dni ? `<br/>DNI: ${row.cliente_dni}` : ""}
           </div>
           <table>
             <thead>
               <tr class="dashed">
                 <th>Cant</th>
                 <th>Descripción</th>
                 <th class="right">Total</th>
               </tr>
             </thead>
             <tbody>${filasHTML}</tbody>
           </table>
           <div style="margin-top: 8px; border-top: 1px dashed black; padding-top: 5px;">
             <div class="totals-row">
               <span>OP. GRAVADA:</span>
               <span>S/ ${opGravada.toFixed(2)}</span>
             </div>
             <div class="totals-row">
               <span>I.G.V. (18%):</span>
               <span>S/ ${igv.toFixed(2)}</span>
             </div>
             <div class="totals-row">
               <span>SUBTOTAL:</span>
               <span>S/ ${subtotal.toFixed(2)}</span>
             </div>
             <div class="totals-row bold" style="font-size: 13px; margin-top: 4px; padding-top: 4px; border-top: 1px solid black;">
               <span>TOTAL A PAGAR:</span>
               <span>S/ ${totalNum.toFixed(2)}</span>
             </div>
           </div>
           <br/>
           <div class="center" style="font-size: 11px;">
             Atendido por: ${row.vendedor_nombre || "Vendedor"}<br/>
             ¡Gracias por su preferencia!
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
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, []);

  return { printTicket };
}