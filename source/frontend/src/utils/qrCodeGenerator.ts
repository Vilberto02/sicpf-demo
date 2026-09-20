import QRCode from "qrcode";

export interface TicketQRData {
  ruc: string;
  tipoComprobante?: string;
  serie: string;
  correlativo: string;
  igv: number;
  total: number;
  fecha: string;
  clienteDni?: string | null;
}

/**
 * Genera un código QR en base64 DataURL siguiendo la trama oficial SUNAT para comprobantes electrónicos.
 */
export async function generateTicketQRCode(data: TicketQRData): Promise<string> {
  const sunatString = [
    data.ruc,
    "03", // 03 = Boleta de Venta Electrónica
    data.serie,
    data.correlativo,
    data.igv.toFixed(2),
    data.total.toFixed(2),
    data.fecha ? data.fecha.split("T")[0] : new Date().toISOString().split("T")[0],
    data.clienteDni && data.clienteDni.length === 8 ? "1" : "0", // 1 = DNI, 0 = Sin documento
    data.clienteDni || "00000000",
    "",
  ].join("|");

  try {
    return await QRCode.toDataURL(sunatString, {
      width: 130,
      margin: 1,
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("Error generando QR para el ticket:", err);
    return "";
  }
}
