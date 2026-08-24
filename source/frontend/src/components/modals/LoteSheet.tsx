import { useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useInventoryStore } from "@/features/inventory/store";
import { useProductStore } from "@/features/products/store";
import { SearchableSelect } from "../common/SearchableSelect";
import { NewProductDialog } from "./NewProductDialog";
import type { LoteType } from "@/types/types";
import type { ProductoType } from "@/features/products/types";

type LoteFormValues = {
  codigo_lote: string;
  fecha_vencimiento: string;
  stock_real: string;
  stock_flotante: string;
};

const emptyLote: LoteFormValues = {
  codigo_lote: "",
  fecha_vencimiento: "",
  stock_real: "",
  stock_flotante: "",
};

type LoteSheetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  lote?: LoteType | null;
  onSaved?: () => void;
  children?: React.ReactNode;
};

export function LoteSheet({ open, onOpenChange, lote, onSaved, children }: LoteSheetProps) {
  const { fetchItems, addItem, updateItem } = useInventoryStore();
  const { products, fetchProducts } = useProductStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? !!open : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  const [selectedProduct, setSelectedProduct] = useState<ProductoType | null>(null);
  const [loteData, setLoteData] = useState<LoteFormValues>(emptyLote);

  const resetLoteForm = () => {
    setSelectedProduct(null);
    setLoteData(emptyLote);
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      if (lote) {
        setLoteData({
          codigo_lote: lote.codigo_lote,
          fecha_vencimiento: lote.fecha_vencimiento,
          stock_real: String(lote.stock_real),
          stock_flotante: String(lote.stock_flotante),
        });
      } else {
        resetLoteForm();
      }
    }
  }, [isOpen, lote]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lote && !selectedProduct) {
      toast.error("Debe seleccionar un producto.");
      return;
    }
    setIsSaving(true);
    try {
      if (lote) {
        await updateItem(lote.id, {
          codigo_lote: loteData.codigo_lote.trim(),
          fecha_vencimiento: loteData.fecha_vencimiento,
          stock_real: Number(loteData.stock_real || 0),
          stock_flotante: Number(loteData.stock_flotante || 0),
        });
      } else {
        await addItem({
          producto: selectedProduct!.id,
          codigo_lote: loteData.codigo_lote.trim(),
          fecha_vencimiento: loteData.fecha_vencimiento,
          stock_real: Number(loteData.stock_real || 0),
          stock_flotante: Number(loteData.stock_flotante || 0),
        });
      }
      toast.success(
        lote ? "Lote actualizado exitosamente." : "Lote agregado exitosamente al inventario."
      );
      setIsOpen(false);
      resetLoteForm();
      fetchItems();
      onSaved?.();
    } catch (error: any) {
      toast.error(`Error al guardar el lote: ${error.message || "Contacte a soporte"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled &&
        (children ? (
          <SheetTrigger asChild>{children}</SheetTrigger>
        ) : (
          <SheetTrigger asChild>
            <Button className="cursor-pointer flex gap-2 items-center w-full md:w-auto shadow-sm">
              <PackagePlus></PackagePlus> Agregar Lote
            </Button>
          </SheetTrigger>
        ))}
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl text-primary font-semibold tracking-tight">
            {lote ? "Editar Lote" : "Registrar Nuevo Lote"}
          </SheetTitle>
          <SheetDescription>
            {lote
              ? `Modifica los datos del lote ${lote.codigo_lote}.`
              : "Añade un nuevo lote a un producto existente en el inventario."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-6 py-4 px-4">
          {lote ? (
            <div className="flex flex-col gap-3">
              <Label>Producto</Label>
              <Input value={`${lote.producto_nombre} (${lote.producto_codigo})`} disabled />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Label htmlFor="productoId">Producto</Label>
              <SearchableSelect
                items={products}
                value={selectedProduct}
                onSelect={setSelectedProduct}
                getOptionLabel={(p) => p.nombre}
                getOptionSubLabel={(p) => `${p.codigo} | ${p.categoria_nombre ?? ""}`}
                filterMatch={(p, query) =>
                  p.nombre.toLowerCase().includes(query.toLowerCase()) ||
                  p.codigo.toLowerCase().includes(query.toLowerCase())
                }
                placeholder="Ej. Buscar producto..."
                emptyMessage="No se encontraron productos"
                actionButton={<NewProductDialog onSaved={setSelectedProduct} />}
              />
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Label htmlFor="batch">Código de Lote</Label>
            <Input
              id="batch"
              placeholder="L-2024-XXX"
              required
              value={loteData.codigo_lote}
              onChange={(e) => setLoteData({ ...loteData, codigo_lote: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="expiry">Fecha de Vencimiento</Label>
            <Input
              id="expiry"
              type="date"
              required
              value={loteData.fecha_vencimiento}
              onChange={(e) => setLoteData({ ...loteData, fecha_vencimiento: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="realStock">Stock Inicial (Cajas)</Label>
              <Input
                id="realStock"
                type="number"
                placeholder="0"
                required
                min="0"
                value={loteData.stock_real}
                onChange={(e) => setLoteData({ ...loteData, stock_real: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="floatStock">Stock Inicial (Unidades)</Label>
              <Input
                id="floatStock"
                type="number"
                placeholder="0"
                required
                min="0"
                value={loteData.stock_flotante}
                onChange={(e) => setLoteData({ ...loteData, stock_flotante: e.target.value })}
              />
            </div>
          </div>
          <SheetFooter className="mt-4">
            <Button type="submit" className="w-full cursor-pointer shadow-sm" disabled={isSaving}>
              {lote ? "Guardar Cambios" : "Guardar Lote"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
