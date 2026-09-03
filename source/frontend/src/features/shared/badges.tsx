import { memo } from "react";

const badgeBase =
  "px-2 py-1 rounded-md text-xs font-medium border";

const productStyles: Record<string, string> = {
  vencido: "bg-red-100 text-red-800 border-red-200",
  "por vencer": "bg-yellow-100 text-yellow-800 border-yellow-200",
  activo: "bg-green-100 text-green-800 border-green-200",
};

const saleStyles: Record<string, string> = {
  Cancelado: "bg-red-100 text-red-800 border-red-200",
  Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Completado: "bg-green-100 text-green-800 border-green-200",
};

function statusBadgeValue(value: string | null | undefined) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const ProductStatusBadge = memo(function ProductStatusBadge({
  estado,
}: {
  estado?: string | null;
}) {
  return (
    <span className={`${badgeBase} ${productStyles[estado || ""] || ""} rounded-full`}>
      {statusBadgeValue(estado)}
    </span>
  );
});

export const SaleStatusBadge = memo(function SaleStatusBadge({
  estado,
}: {
  estado?: string | null;
}) {
  return (
    <span className={`${badgeBase} ${saleStyles[estado || ""] || ""} rounded-full`}>
      {statusBadgeValue(estado)}
    </span>
  );
});