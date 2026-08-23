const badgeBase =
  "px-2 py-1 rounded-full text-xs font-medium border";

export const TIPO_LABELS: Record<string, string> = {
  stock_critico: "Stock crítico",
  stock_bajo: "Stock bajo",
  vencimiento: "Vencimiento",
  quiebre: "Quiebre estimado",
};

export function TipoBadge({ tipo }: { tipo?: string | null }) {
  if (!tipo) return <span className="text-xs text-muted-foreground">-</span>;
  const styles: Record<string, string> = {
    stock_critico: "bg-red-100 text-red-800 border-red-200",
    stock_bajo: "bg-yellow-100 text-yellow-800 border-yellow-200",
    vencimiento: "bg-orange-100 text-orange-800 border-orange-200",
    quiebre: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span className={`${badgeBase} ${styles[tipo] || ""}`}>
      {TIPO_LABELS[tipo] ?? tipo}
    </span>
  );
}

export function NivelRiesgoBadge({ nivel }: { nivel: string }) {
  const styles: Record<string, string> = {
    alto: "bg-red-100 text-red-800 border-red-200",
    medio: "bg-yellow-100 text-yellow-800 border-yellow-200",
    bajo: "bg-green-100 text-green-800 border-green-200",
  };
  return (
    <span className={`${badgeBase} ${styles[nivel] || ""}`}>
      {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
    </span>
  );
}

export function OrigenBadge({ origen }: { origen: string }) {
  const styles: Record<string, string> = {
    reglas: "bg-blue-100 text-blue-800 border-blue-200",
    ml: "bg-purple-100 text-purple-800 border-purple-200",
    manual: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return (
    <span className={`${badgeBase} ${styles[origen] || ""}`}>
      {origen.charAt(0).toUpperCase() + origen.slice(1)}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    pendiente: "bg-orange-100 text-orange-800 border-orange-200",
    revisada: "bg-green-100 text-green-800 border-green-200",
    descartada: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`${badgeBase} ${styles[estado] || ""}`}>
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}
