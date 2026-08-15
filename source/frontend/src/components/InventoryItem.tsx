export type StateType = "activo" | "vencido" | "por vencer" | "active" | "defeated" | "to be defeated";
export type LevelType = "alto" | "medio" | "bajo" | "high" | "medium" | "low";

type InventoryItemProps =
  | {
      variant: "state";
      title: string;
      code: string;
      state: StateType;
    }
  | {
      variant: "level";
      title: string;
      level: LevelType;
    };

const getStateStyle = (state: StateType) => {
  if (state === "active" || state === "activo") return "text-green-500 border-green-500";
  if (state === "defeated" || state === "vencido") return "text-red-500 border-red-500";
  if (state === "to be defeated" || state === "por vencer") return "text-warning border-warning";
  return "text-gray-500 border-gray-500";
};

const getLevelStyle = (level: LevelType) => {
  if (level === "high" || level === "alto") return "text-red-500";
  if (level === "medium" || level === "medio") return "text-warning";
  if (level === "low" || level === "bajo") return "text-green-500";
  return "text-gray-500";
};

const getStateText = (state: StateType) => {
  if (state === "active" || state === "activo") return "Activo";
  if (state === "defeated" || state === "vencido") return "Vencido";
  if (state === "to be defeated" || state === "por vencer") return "Por vencer";
  return state;
};

const getLevelText = (level: LevelType) => {
  if (level === "high" || level === "alto") return "Alto";
  if (level === "medium" || level === "medio") return "Medio";
  if (level === "low" || level === "bajo") return "Bajo";
  return level;
};

export function InventoryItem(props: InventoryItemProps) {
  if (props.variant === "state") {
    const { title, code, state } = props;
    return (
      <div className="p-3 flex justify-between items-center border-br-card border-2 rounded-xl">
        <div className="text-quaternary space-y-2">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{code}</p>
        </div>
        <div
          className={`${getStateStyle(state)} p-1.5 border rounded-md select-none text-xs font-medium`}
        >
          {getStateText(state)}
        </div>
      </div>
    );
  }

  if (props.variant === "level") {
    const { title, level } = props;
    return (
      <div className="p-3 flex flex-col gap-1 items-start bg-[#F8FFFB] border-br-card border-2 rounded-xl">
        <p className="font-semibold text-sm">{title}</p>
        <p className={`${getLevelStyle(level)} select-none text-xs font-medium`}>
          {getLevelText(level)}
        </p>
      </div>
    );
  }

  return null;
}
