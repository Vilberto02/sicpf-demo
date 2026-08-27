import { useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useProductStore } from "@/features/products/store";
import { getCategorias, getPresentaciones } from "@/features/products/api";
import type {
  ProductoType,
  CategoriaType,
  PresentacionType,
} from "@/features/products/types";

type NewProductDialogProps = {
  product?: ProductoType | null;
  onSaved?: (product: ProductoType) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const emptyForm = {
  codigo: "",
  nombre: "",
  descripcion: "",
  categoria: "",
  presentacion: "",
  precio_real: "",
  precio_flotante: "",
  precio_blister: "",
  unidades_por_caja: "1",
  blisters_por_caja: "1",
  unidades_por_blister: "1",
  presentacion_principal: true,
  presentacion_blister: true,
  presentacion_unidad: true,
};

const toForm = (product: ProductoType) => ({
  codigo: product.codigo,
  nombre: product.nombre,
  descripcion: product.descripcion ?? "",
  categoria: String(product.categoria),
  presentacion: String(product.presentacion),
  precio_real: String(product.precio_real ?? ""),
  precio_flotante: String(product.precio_flotante ?? ""),
  precio_blister: String(product.precio_blister ?? ""),
  unidades_por_caja: String(product.unidades_por_caja ?? 1),
  blisters_por_caja: String(product.blisters_por_caja ?? 1),
  unidades_por_blister: String(product.unidades_por_blister ?? 1),
  presentacion_principal: product.presentacion_principal,
  presentacion_blister: product.presentacion_blister,
  presentacion_unidad: product.presentacion_unidad,
});

export function NewProductDialog({ product, onSaved, children, open, onOpenChange }: NewProductDialogProps) {
  const { addProduct, updateProduct } = useProductStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? !!open : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [categorias, setCategorias] = useState<CategoriaType[]>([]);
  const [presentaciones, setPresentaciones] = useState<PresentacionType[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getCategorias()
      .then((data) => setCategorias(Array.isArray(data) ? data : data.results ?? []))
      .catch((e) => toast.error(`Error al cargar categorías: ${e.message}`));
    getPresentaciones()
      .then((data) => setPresentaciones(Array.isArray(data) ? data : data.results ?? []))
      .catch((e) => toast.error(`Error al cargar presentaciones: ${e.message}`));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && product) setFormData(toForm(product));
  }, [isOpen, product]);

  const usaCaja = formData.presentacion_principal;
  const usaBlister = formData.presentacion_blister;

  const setPresentacion = (key: "principal" | "blister" | "unidad", checked: boolean) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (key === "principal") {
        next.presentacion_principal = checked;
        if (!checked) next.unidades_por_caja = "1";
      }
      if (key === "blister") {
        next.presentacion_blister = checked;
        if (!checked) {
          next.blisters_por_caja = "1";
          next.unidades_por_blister = "1";
          next.precio_blister = "";
        }
      }
      if (key === "unidad") {
        next.presentacion_unidad = checked;
      }
      return next;
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoria || !formData.presentacion) {
      toast.error("Debe seleccionar categoría y presentación.");
      return;
    }
    if (!formData.presentacion_principal && !formData.presentacion_blister && !formData.presentacion_unidad) {
      toast.error("Debe habilitar al menos una presentación.");
      return;
    }
    setIsSaving(true);
    const payload = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      categoria: Number(formData.categoria),
      presentacion: Number(formData.presentacion),
      precio_real: Number(formData.precio_real),
      precio_flotante: Number(formData.precio_flotante),
      precio_blister: Number(formData.precio_blister || 0),
      unidades_por_caja: Number(formData.unidades_por_caja),
      blisters_por_caja: Number(formData.blisters_por_caja),
      unidades_por_blister: Number(formData.unidades_por_blister),
      presentacion_principal: formData.presentacion_principal,
      presentacion_blister: formData.presentacion_blister,
      presentacion_unidad: formData.presentacion_unidad,
    };
    const saved = product
      ? await updateProduct(product.id, payload)
      : await addProduct(payload);
    setIsSaving(false);

    if (saved) {
      toast.success(product ? "Producto actualizado exitosamente." : "Producto creado exitosamente.");
      onSaved?.(saved);
      setIsOpen(false);
      setFormData(emptyForm);
    } else {
      toast.error(
        product ? "No se pudo actualizar el producto. Verifique los datos." : "No se pudo crear el producto. Verifique los datos."
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(value) => { setIsOpen(value); if (!value) setFormData(emptyForm); }}>
      {!isControlled &&
        (children ? (
          <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button className="cursor-pointer" variant="outline" size="icon" title={product ? "Editar producto" : "Agregar nuevo producto"}>
              <PackagePlus size={18} />
            </Button>
          </DialogTrigger>
        ))}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                required
                value={formData.codigo}
                placeholder="Ej. MED-001"
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                required
                value={formData.nombre}
                placeholder="Ej. Paracetamol"
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              value={formData.descripcion}
              placeholder="Ej. Analgésico 500mg"
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                required
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Presentación</Label>
              <Select
                required
                value={formData.presentacion}
                onValueChange={(value) => setFormData({ ...formData, presentacion: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {presentaciones.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Precio Caja (S/)</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_real}
                placeholder="0.00"
                onChange={(e) => setFormData({ ...formData, precio_real: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio Und. (S/)</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_flotante}
                placeholder="0.00"
                onChange={(e) => setFormData({ ...formData, precio_flotante: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio Blíster (S/)</Label>
              <Input
                disabled={!usaBlister}
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_blister}
                placeholder="Auto"
                onChange={(e) => setFormData({ ...formData, precio_blister: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unds. por caja</Label>
              <Input
                required={usaCaja}
                disabled={!usaCaja}
                type="number"
                min="1"
                value={formData.unidades_por_caja}
                placeholder="1"
                onChange={(e) => setFormData({ ...formData, unidades_por_caja: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Blísters por caja</Label>
              <Input
                required={usaBlister}
                disabled={!usaBlister}
                type="number"
                min="1"
                value={formData.blisters_por_caja}
                placeholder="1"
                onChange={(e) => setFormData({ ...formData, blisters_por_caja: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Unds. por blíster</Label>
              <Input
                required={usaBlister}
                disabled={!usaBlister}
                type="number"
                min="1"
                value={formData.unidades_por_blister}
                placeholder="1"
                onChange={(e) => setFormData({ ...formData, unidades_por_blister: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Presentaciones habilitadas</Label>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.presentacion_principal}
                  onCheckedChange={(checked) => setPresentacion("principal", checked === true)}
                />
                Caja / principal
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.presentacion_blister}
                  onCheckedChange={(checked) => setPresentacion("blister", checked === true)}
                />
                Blíster
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.presentacion_unidad}
                  onCheckedChange={(checked) => setPresentacion("unidad", checked === true)}
                />
                Unidad
              </label>
            </div>
            {!formData.presentacion_principal && !formData.presentacion_blister && !formData.presentacion_unidad && (
              <p className="text-xs text-destructive">Habilita al menos una presentación.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving} className="cursor-pointer">
              {product ? "Guardar cambios" : "Guardar producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
