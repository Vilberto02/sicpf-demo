import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { SaleItemType } from "@/features/sales/types";
import type { VentaDetalleType } from "@/types";
import { formatDateTime } from "@/features/shared/dateUtils";
import { useAuthStore } from "@/features/auth/store";
import { getNegocio, DEFAULT_NEGOCIO } from "@/features/business/api";
import type { NegocioType } from "@/features/business/types";
import { numeroALetras } from "@/utils/numberToLetters";
import { generateTicketQRCode } from "@/utils/qrCodeGenerator";

export function usePrintTicket() {
  const [negocio, setNegocio] = useState<NegocioType>(DEFAULT_NEGOCIO);
  const userProfile = useAuthStore((s) => s.userProfile);

  useEffect(() => {
    getNegocio()
      .then((data) => setNegocio(data))
      .catch((err) => console.warn("Error cargando datos del negocio:", err));
  }, []);

  const printTicket = useCallback(async (row: SaleItemType) => {
    try {
      // 1. Obtener la configuración más reciente del negocio si es posible
    let currentNegocio = negocio;
    try {
      currentNegocio = await getNegocio();
    } catch {
      currentNegocio = negocio;
    }

    const isDemo = [currentNegocio.nombre_comercial, currentNegocio.razon_social, currentNegocio.ruc, currentNegocio.direccion]
      .some((value) => !value.trim());

    const totalNum = Number(row.total) || 0;
    const opGravada = row.op_gravada !== undefined && row.op_gravada !== null
      ? Number(row.op_gravada)
      : Number((totalNum / 1.18).toFixed(2));
    const igv = row.igv !== undefined && row.igv !== null
      ? Number(row.igv)
      : Number((totalNum - opGravada).toFixed(2));

    const fechaDisplay = row.fecha ? formatDateTime(row.fecha) : formatDateTime(new Date().toISOString());
    const atendidoPor = (row.vendedor_nombre || (userProfile ? `${userProfile.nombre} ${userProfile.apellido}`.trim() : "") || "Vendedor").toUpperCase();
    const clienteNombre = (row.cliente_nombre || "CLIENTE GENERAL").toUpperCase();
    const clienteDni = row.cliente_dni || "00000000";

    // Serie y correlativo
    let serie = row.serie || currentNegocio.serie_boleta_defecto || "B001";
    let correlativo = row.correlativo || "";
    if (!correlativo && row.codigo) {
      if (row.codigo.includes("-")) {
        const parts = row.codigo.split("-");
        serie = parts[0] || serie;
        correlativo = parts.slice(1).join("-");
      } else {
        correlativo = row.codigo;
      }
    }
    if (!correlativo) correlativo = "000001";

    const serieCorrelativoDisplay = `${serie} - ${correlativo}`;

    // 2. Filas de productos (sin lote ni fecha de vencimiento)
    let filasHTML = "";
    if (row.detalles && row.detalles.length > 0) {
      row.detalles.forEach((d: VentaDetalleType) => {
        const cantReal = Number(d.cantidad_real) || 0;
        const cantBlister = Number(d.cantidad_blister) || 0;
        const cantFlotante = Number(d.cantidad_flotante) || 0;
        const precReal = Number(d.precio_real) || 0;
        const precBlister = Number(d.precio_blister) || 0;
        const precFlotante = Number(d.precio_flotante) || 0;

        let qty = 0;
        let um = "UND";
        let precio = 0;
        let totalLinea = 0;

        if (cantReal > 0) {
          qty = cantReal;
          um = "CJ";
          precio = precReal;
          totalLinea = cantReal * precReal;
        } else if (cantBlister > 0) {
          qty = cantBlister;
          um = "BL";
          precio = precBlister;
          totalLinea = cantBlister * precBlister;
        } else if (cantFlotante > 0) {
          qty = cantFlotante;
          um = "UND";
          precio = precFlotante;
          totalLinea = cantFlotante * precFlotante;
        }

        if (qty === 0) {
          const fallbackQty = Number((d as Record<string, unknown>).cantidad) || 1;
          const fallbackPrice = Number((d as Record<string, unknown>).precio) || precReal || precFlotante || 0;
          qty = fallbackQty;
          precio = fallbackPrice;
          totalLinea = qty * precio;
        }

        const detailRecord = d as Record<string, unknown>;
        if (detailRecord.subtotal !== undefined && detailRecord.subtotal !== null) {
          const sub = Number(detailRecord.subtotal);
          if (!isNaN(sub) && sub > 0) {
            totalLinea = sub;
          }
        }

        if (qty > 0) {
          filasHTML += `
            <tr>
              <td style="vertical-align: top; padding: 2px 0;">${qty.toFixed(2)}</td>
              <td style="vertical-align: top; padding: 2px 4px;">${d.producto_nombre || "Producto"}</td>
              <td style="vertical-align: top; text-align: center; padding: 2px 0;">${um}</td>
              <td style="vertical-align: top; text-align: right; padding: 2px 0;">${precio.toFixed(2)}</td>
              <td style="vertical-align: top; text-align: right; padding: 2px 0;">${totalLinea.toFixed(2)}</td>
            </tr>
          `;
        }
      });
    }

    // 3. Monto en letras y datos de pago / sede
    const montoEnLetras = numeroALetras(totalNum, currentNegocio.moneda_nombre || "SOLES");
    const formaPago = row.forma_pago || "Contado";
    const metodoPago = String(row.metodo_pago_nombre || row.metodo_pago || "Efectivo");

    // Dirección: Priorizar la dirección de la entidad Sede sobre la dirección general del negocio
    const direccionSede = (row.sede_direccion || "").trim();
    const direccionFinal = direccionSede || currentNegocio.direccion;
    const nombreSede = (row.sede_nombre || "").trim();

    // 4. Generación del código QR SUNAT
    const qrDataUrl = isDemo ? "" : await generateTicketQRCode({
      ruc: currentNegocio.ruc,
      tipoComprobante: "03",
      serie,
      correlativo,
      igv,
      total: totalNum,
      fecha: row.fecha || new Date().toISOString(),
      clienteDni: row.cliente_dni,
    });

    // 5. Contenido HTML del comprobante (impresora térmica 80mm)
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Comprobante ${serieCorrelativoDisplay}</title>
          <style>
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 72mm;
              margin: 0 auto;
              padding: 4mm 1mm;
              font-size: 11px;
              color: #000;
              line-height: 1.25;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .dashed { border-bottom: 1px dashed #000; margin: 5px 0; }
            .flex-between {
              display: flex;
              justify-content: space-between;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
              font-size: 10.5px;
            }
            th {
              font-size: 11px;
              font-weight: bold;
              border-bottom: 1px dashed #000;
              padding: 2px 0;
            }
          </style>
        </head>
        <body>
          <!-- Cabecera del Negocio -->
          <div class="center">
            ${
              !isDemo && currentNegocio.logo_url
                ? `<img src="${currentNegocio.logo_url}" alt="Logo" style="max-height: 48px; max-width: 130px; margin: 0 auto 3px auto; display: block;" />`
                : `<div class="bold" style="font-size: 20px; letter-spacing: 2px; margin-bottom: 3px;">SICPF</div>`
            }
            ${!isDemo ? `<div class="bold" style="font-size: 12px;">RUC ${currentNegocio.ruc}</div>` : ""}
            ${!isDemo ? `<div class="bold" style="font-size: 12px; text-transform: uppercase;">${currentNegocio.nombre_comercial}</div>` : ""}
            ${!isDemo && nombreSede ? `<div class="bold" style="font-size: 10px; margin-top: 2px; letter-spacing: 0.5px;">SEDE: ${nombreSede.toUpperCase()}</div>` : ""}
            ${!isDemo && direccionFinal ? `<div style="font-size: 10px; margin-top: 1px;">${direccionFinal.toUpperCase()}</div>` : ""}
            ${
              !isDemo && !direccionSede && currentNegocio.distrito
                ? `<div style="font-size: 9.5px; margin-top: 1px;">${currentNegocio.distrito.toUpperCase()} - ${currentNegocio.provincia.toUpperCase()} - ${currentNegocio.departamento.toUpperCase()}</div>`
                : ""
            }
          </div>


          <div class="dashed"></div>

          <!-- Tipo y Número de Comprobante -->
          <div class="center">
            <div class="bold" style="font-size: 12px;">${isDemo ? "TICKET DE DEMOSTRACIÓN — SIN VALIDEZ TRIBUTARIA" : "BOLETA DE VENTA ELECTRONICA"}</div>
            <div class="bold" style="font-size: 14px; letter-spacing: 1px; margin-top: 2px;">
              ${serieCorrelativoDisplay}
            </div>
          </div>

          <div class="dashed"></div>

          <!-- Datos de Emisión y Despacho -->
          <div style="font-size: 10.5px; line-height: 1.35;">
            <div><span class="bold">F.Emisión :</span> ${fechaDisplay}</div>
            <div><span class="bold">Cajero(a):</span> ${atendidoPor}</div>
            <div><span class="bold">Vendedor(a):</span> ${atendidoPor}</div>
            <div><span class="bold">Moneda:</span> ${currentNegocio.moneda_nombre || "SOLES"}</div>
          </div>

          <div class="dashed"></div>

          <!-- Datos del Cliente -->
          <div style="font-size: 10.5px; line-height: 1.35;">
            <div><span class="bold">CLIENTE :</span> ${clienteNombre}</div>
            <div><span class="bold">Nro. DNI :</span> ${clienteDni}</div>
            <div><span class="bold">Fecha Entrega Producto :</span> ${fechaDisplay}</div>
          </div>

          <div class="dashed"></div>

          <!-- Tabla de Productos -->
          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 14%;">Cant</th>
                <th style="text-align: left; width: 44%; padding-left: 4px;">Descripción</th>
                <th style="text-align: center; width: 12%;">UM</th>
                <th style="text-align: right; width: 15%;">Precio</th>
                <th style="text-align: right; width: 15%;">Import</th>
              </tr>
            </thead>
            <tbody>
              ${filasHTML}
            </tbody>
          </table>

          <div class="dashed"></div>

          <!-- Desglose Tributario y Totales -->
          <div style="font-size: 10.5px; line-height: 1.35;">
            <div class="flex-between">
              <span>Op. Gravada : ${currentNegocio.moneda_simbolo || "S/"}</span>
              <span>${opGravada.toFixed(2)}</span>
            </div>
            <div class="flex-between">
              <span>IGV 18% : ${currentNegocio.moneda_simbolo || "S/"}</span>
              <span>${igv.toFixed(2)}</span>
            </div>
            <div class="flex-between bold" style="font-size: 12px; margin-top: 2px;">
              <span>Total a Pagar : ${currentNegocio.moneda_simbolo || "S/"}</span>
              <span>${totalNum.toFixed(2)}</span>
            </div>
          </div>

          <div class="dashed"></div>

          <!-- Importe en Letras y Medio de Pago -->
          <div style="font-size: 10.5px; line-height: 1.35;">
            <div class="bold" style="font-size: 10px;">${montoEnLetras}</div>
            <div style="margin-top: 2px;"><span class="bold">Forma de Pago:</span> ${formaPago}</div>
            <div style="margin-top: 4px;"><span class="bold">Método Pago.</span></div>
            <div class="flex-between" style="padding-left: 4px;">
              <span>${metodoPago.toUpperCase()} ${currentNegocio.moneda_simbolo || "S/"}</span>
              <span>${totalNum.toFixed(2)}</span>
            </div>
          </div>

          <!-- Código QR -->
          ${
            qrDataUrl
              ? `
            <div class="center" style="margin: 8px 0 4px 0;">
              <img src="${qrDataUrl}" alt="QR Comprobante" style="width: 110px; height: 110px; margin: 0 auto; display: block;" />
            </div>
          `
              : ""
          }

          <!-- Pie de Página y Mensajes -->
          <div class="center" style="font-size: 9.5px; margin-top: 4px; line-height: 1.35;">
            ${!isDemo && currentNegocio.url_consulta.trim() ? `<div>Consulte sus comprobantes en:</div><div style="word-break: break-all; color: #222;">${currentNegocio.url_consulta}</div>` : ""}
            <div class="bold" style="margin-top: 5px; white-space: pre-line;">${currentNegocio.mensaje_pie}</div>
            <div style="margin-top: 5px; font-size: 8.5px; color: #444; white-space: pre-line;">${currentNegocio.leyenda_software}</div>
          </div>
        </body>
      </html>
    `;

      // 6. Enviar a impresión silenciosa mediante iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      if (iframe.contentWindow) {
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(content);
        iframe.contentWindow.document.close();

        const triggerPrint = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error("Error al disparar la ventana de impresión:", e);
          }
        };

        // Esperar a que el contenido (imágenes/QR) se renderice antes de abrir el diálogo de impresión
        setTimeout(triggerPrint, 350);
      }

      const cleanup = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };

      if (iframe.contentWindow) {
        iframe.contentWindow.onafterprint = cleanup;
      }
      setTimeout(cleanup, 60000);
    } catch (error) {
      console.error("Error al generar o imprimir la boleta:", error);
      toast.error("No se pudo generar o imprimir la boleta.");
    }
  }, [negocio, userProfile]);

  return { printTicket };
}
