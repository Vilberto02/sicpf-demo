export type StateType = "active" | "defeated" | "to be defeated";
export type LevelType = "high" | "medium" | "low";

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

const stateStyles: Record<StateType, string> = {
  active: "text-green-500 border-green-500",
  defeated: "text-red-500 border-red-500",
  "to be defeated": "text-warning border-warning",
};

const levelStyles: Record<LevelType, string> = {
  high: "text-red-500",
  medium: "text-warning",
  low: "text-green-500",
};

const getStateText = (state: StateType) => {
  switch (state) {
    case "active":
      return "Activo";
    case "defeated":
      return "Vencido";
    case "to be defeated":
      return "Por vencer";
  }
};

const getLevelText = (level: LevelType) => {
  switch (level) {
    case "high":
      return "Alto";
    case "medium":
      return "Medio";
    case "low":
      return "Bajo";
  }
};

export function InventoryItem(props: InventoryItemProps) {
  if (props.variant === "state") {
    const { title, code, state } = props;
    return (
      <div className="p-3 flex justify-between items-center border-br-card border-2 rounded-xl">
        <div className="text-quaternary space-y-2">
          <p className="font-semibold">{title}</p>
          <p>{code}</p>
        </div>
        <div
          className={`${stateStyles[state]} p-2 border rounded-md select-none`}
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
        <p className="font-semibold">{title}</p>
        <p className={`${levelStyles[level]} select-none`}>
          {getLevelText(level)}
        </p>
      </div>
    );
  }

  return null;
}
