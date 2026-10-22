import { act, renderHook } from "@testing-library/react";
import { usePrintTicket } from "./usePrintTicket";
import { DEFAULT_NEGOCIO, getNegocio } from "@/features/business/api";
import { generateTicketQRCode } from "@/utils/qrCodeGenerator";
import type { SaleItemType } from "@/features/sales/types";

jest.mock("@/lib/apiClient", () => ({ apiClient: jest.fn() }));
jest.mock("@/features/auth/store", () => ({ useAuthStore: () => null }));
jest.mock("@/utils/qrCodeGenerator", () => ({ generateTicketQRCode: jest.fn() }));

import { apiClient } from "@/lib/apiClient";

const configured = {
  ...DEFAULT_NEGOCIO,
  nombre_comercial: "Farmacia de ejemplo",
  razon_social: "Empresa de ejemplo",
  ruc: "00000000000",
  direccion: "Dirección de ejemplo",
};

describe("ticket identity", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(generateTicketQRCode).mockResolvedValue("data:image/png;base64,QR");
  });

  afterEach(() => {
    document.querySelectorAll("iframe").forEach((frame) => frame.remove());
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  async function print() {
    const { result, unmount } = renderHook(() => usePrintTicket());
    await act(async () => {
      const sale: SaleItemType = {
        codigo: "B001-000001", cliente: 1, fecha: "2026-10-21T12:00:00Z",
        estado: "completada", total: 18, metodo_pago_nombre: "Efectivo",
      };
      await result.current.printTicket(sale);
    });
    const body = document.querySelector("iframe")!.contentDocument!.body;
    const html = body.innerHTML;
    const text = body.textContent!;
    unmount();
    return { html, text };
  }

  it("prints a neutral demo without fiscal identity or QR", async () => {
    jest.mocked(apiClient).mockResolvedValue(DEFAULT_NEGOCIO);
    const { html, text } = await print();
    expect(text).toContain("TICKET DE DEMOSTRACIÓN — SIN VALIDEZ TRIBUTARIA");
    expect(text).toContain("18.00");
    expect(text).toContain("EFECTIVO");
    expect(html).not.toContain("RUC ");
    expect(text).not.toContain("Consulte sus comprobantes");
    expect(generateTicketQRCode).not.toHaveBeenCalled();
  });

  it.each(["nombre_comercial", "razon_social", "ruc", "direccion"])("uses demo mode when %s is blank", async (field) => {
    jest.mocked(apiClient).mockResolvedValue({ ...configured, [field]: "  " });
    expect((await print()).text).toContain("SIN VALIDEZ TRIBUTARIA");
    expect(generateTicketQRCode).not.toHaveBeenCalled();
  });

  it("prints configured identity and QR without an empty consultation link", async () => {
    jest.mocked(apiClient).mockResolvedValue(configured);
    const { text, html } = await print();
    expect(text).toContain(configured.nombre_comercial);
    expect(text).toContain(`RUC ${configured.ruc}`);
    expect(text).toContain("BOLETA DE VENTA ELECTRONICA");
    expect(text).not.toContain("Consulte sus comprobantes");
    expect(html).toContain("QR Comprobante");
    expect(generateTicketQRCode).toHaveBeenCalledTimes(1);
  });

  it("falls back to neutral values if the API fails", async () => {
    jest.mocked(apiClient).mockRejectedValue(new Error("offline"));
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(await getNegocio()).toEqual(DEFAULT_NEGOCIO);
    expect((await print()).text).toContain("SIN VALIDEZ TRIBUTARIA");
    expect(generateTicketQRCode).not.toHaveBeenCalled();
    warning.mockRestore();
  });
});
