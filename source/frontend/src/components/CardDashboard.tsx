import { type LucideIcon } from "lucide-react";
import { memo, type ReactNode } from "react";

type CardVariant = "default" | "success" | "warning" | "danger" | "info";

type CardDashboardProps = {
  title: string;
  value: string | ReactNode;
  Icon: LucideIcon;
  variant: CardVariant;
}


const variantStyles: Record<CardVariant, string> = {
  default: "text-neutral",
  success: "text-green-500",
  warning: "text-warning",
  danger: "text-red-500",
  info: "text-info",
};

function CardDashboardInner({title, value, Icon, variant} : CardDashboardProps) {
  return (
    <div className="flex flex-col grow px-5 py-6 rounded-xl bg-card shadow-sm ring-1 ring-black/5 min-w-[196px] gap-2">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      <div
        className={`${variantStyles[variant]} flex items-center gap-3 text-4xl mt-1`}
      >
        <Icon width={32} height={32} strokeWidth={2.5}></Icon>
        <p className="font-semibold tabular-nums tracking-tight text-primary">{value}</p>
      </div>
    </div>
  );
}

export const CardDashboard = memo(CardDashboardInner);