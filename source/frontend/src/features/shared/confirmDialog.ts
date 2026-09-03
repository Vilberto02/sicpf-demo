type ConfirmActionOptions = {
  title: string;
  text: string;
  confirmText?: string;
};

export async function confirmAction({
  title,
  text,
  confirmText = "Sí, eliminar",
}: ConfirmActionOptions): Promise<boolean> {
  const { default: Swal } = await import("sweetalert2");
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: confirmText,
    cancelButtonText: "Cancelar",
  });
  return result.isConfirmed;
}