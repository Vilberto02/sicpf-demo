import { type LucideIcon } from "lucide-react";

type CardVariant = "default" | "success" | "warning" | "danger" | "info";

type CardDashboardProps = {
  title: string;
  value: string;
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

export function CardDashboard({title, value, Icon, variant} : CardDashboardProps) {
  return (
    <div className="flex flex-col grow p-4 rounded-2xl border-neutral-400 border-2 min-w-[196px] gap-2">
      <h4 className="font-semibold text-lg">{title}</h4>
      <div
        className={`${variantStyles[variant]} flex items-center gap-2 text-4xl`}
      >
        <Icon width={36} height={36}></Icon>
        <p>{value}</p>
      </div>
    </div>
  );
}