import { toast } from "sonner";

export function getErrorMessage(error: unknown, fallback = "Algo salió mal"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}

export function notifyError(error: unknown, fallback = "Algo salió mal"): void {
  toast.error(getErrorMessage(error, fallback));
}