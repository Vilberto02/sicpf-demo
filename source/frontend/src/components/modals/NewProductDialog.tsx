import { useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { getCategorias, getPresentaciones, getFormasFarmaceuticas } from "@/features/products/api";
import type {
  ProductoType,
  CategoriaType,
  PresentacionType,
  FormaFarmaceuticaType,
} from "@/features/products/types";
import { ProductSchema } from "@/features/products/schemas";

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
  dci: "",
  concentracion: "",
  forma_farmaceutica: "",
  registro_sanitario: "",
  condicion_venta: "libre" as "libre" | "receta" | "receta_retenida",
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
  dci: product.dci ?? "",
  concentracion: product.concentracion ?? "",
  forma_farmaceutica: product.forma_farmaceutica ? String(product.forma_farmaceutica) : "",
  registro_sanitario: product.registro_sanitario ?? "",
  condicion_venta: (product.condicion_venta ?? "libre") as "libre" | "receta" | "receta_retenida",
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
  const [formasFarmaceuticas, setFormasFarmaceuticas] = useState<FormaFarmaceuticaType[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    getCategorias()
      .then((data) => setCategorias(Array.isArray(data) ? data : data.results ?? []))
      .catch((e) => toast.error(`Error al cargar categorías: ${e.message}`));
    getPresentaciones()
      .then((data) => setPresentaciones(Array.isArray(data) ? data : data.results ?? []))
      .catch((e) => toast.error(`Error al cargar presentaciones: ${e.message}`));
    getFormasFarmaceuticas()
      .then((data) => setFormasFarmaceuticas(Array.isArray(data) ? data : data.results ?? []))
      .catch((e) => toast.error(`Error al cargar formas farmacéuticas: ${e.message}`));
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

    const parsed = ProductSchema.safeParse({
      codigo: formData.codigo,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      dci: formData.dci,
      concentracion: formData.concentracion,
      forma_farmaceutica: formData.forma_farmaceutica,
      registro_sanitario: formData.registro_sanitario,
      condicion_venta: formData.condicion_venta,
      categoria: formData.categoria,
      presentacion: formData.presentacion,
      precio_real: formData.precio_real,
      precio_flotante: formData.precio_flotante,
      precio_blister: formData.precio_blister,
      unidades_por_caja: formData.unidades_por_caja,
      blisters_por_caja: formData.blisters_por_caja,
      unidades_por_blister: formData.unidades_por_blister,
      presentacion_principal: formData.presentacion_principal,
      presentacion_blister: formData.presentacion_blister,
      presentacion_unidad: formData.presentacion_unidad,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] = issue.message;
      }
      if (!formData.presentacion_principal && !formData.presentacion_blister && !formData.presentacion_unidad) {
        fieldErrors.form = "Debe habilitar al menos una presentación.";
      }
      setFormErrors(fieldErrors);
      return;
    }
    setFormErrors({});

    setIsSaving(true);
    const payload = {
      codigo: parsed.data.codigo,
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      dci: parsed.data.dci || null,
      concentracion: parsed.data.concentracion || null,
      forma_farmaceutica: parsed.data.forma_farmaceutica || null,
      registro_sanitario: parsed.data.registro_sanitario || null,
      condicion_venta: parsed.data.condicion_venta,
      categoria: Number(parsed.data.categoria),
      presentacion: Number(parsed.data.presentacion),
      precio_real: Number(parsed.data.precio_real),
      precio_flotante: Number(parsed.data.precio_flotante),
      precio_blister: Number(parsed.data.precio_blister || 0),
      unidades_por_caja: Number(parsed.data.unidades_por_caja),
      blisters_por_caja: Number(parsed.data.blisters_por_caja),
      unidades_por_blister: Number(parsed.data.unidades_por_blister),
      presentacion_principal: parsed.data.presentacion_principal,
      presentacion_blister: parsed.data.presentacion_blister,
      presentacion_unidad: parsed.data.presentacion_unidad,
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
      setFormErrors({});
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 py-4 max-h-[90vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                required
                value={formData.codigo}
                placeholder="Ej. MED-001"
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              />
              {formErrors.codigo && (
                <span className="text-sm text-red-700 ml-2">{formErrors.codigo}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                required
                value={formData.nombre}
                placeholder="Ej. Paracetamol"
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
              {formErrors.nombre && (
                <span className="text-sm text-red-700 ml-2">{formErrors.nombre}</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={formData.descripcion}
              placeholder="Ej. Analgésico 500mg"
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
            {formErrors.descripcion && (
              <span className="text-sm text-red-700 ml-2">{formErrors.descripcion}</span>
            )}
          </div>

          {/* Información Sanitaria y Farmacéutica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Principio Activo (DCI)</Label>
              <Input
                value={formData.dci}
                placeholder="Ej. Paracetamol"
                onChange={(e) => setFormData({ ...formData, dci: e.target.value })}
              />
              {formErrors.dci && (
                <span className="text-sm text-red-700 ml-2">{formErrors.dci}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Concentración</Label>
              <Input
                value={formData.concentracion}
                placeholder="Ej. 500 mg, 1 g/5 ml"
                onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
              />
              {formErrors.concentracion && (
                <span className="text-sm text-red-700 ml-2">{formErrors.concentracion}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma Farmacéutica</Label>
              <Select
                value={formData.forma_farmaceutica || "none"}
                onValueChange={(value) => setFormData({ ...formData, forma_farmaceutica: value === "none" ? "" : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar forma..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {formasFarmaceuticas.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.forma_farmaceutica && (
                <span className="text-sm text-red-700 ml-2">{formErrors.forma_farmaceutica}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Registro Sanitario (DIGEMID)</Label>
              <Input
                value={formData.registro_sanitario}
                placeholder="Ej. EN-01234, EE-05678"
                onChange={(e) => setFormData({ ...formData, registro_sanitario: e.target.value })}
              />
              {formErrors.registro_sanitario && (
                <span className="text-sm text-red-700 ml-2">{formErrors.registro_sanitario}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Condición de Venta</Label>
            <Select
              value={formData.condicion_venta}
              onValueChange={(value: "libre" | "receta" | "receta_retenida") =>
                setFormData({ ...formData, condicion_venta: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar condición..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="libre">Venta Libre</SelectItem>
                <SelectItem value="receta">Bajo Receta Médica</SelectItem>
                <SelectItem value="receta_retenida">Receta Retenida / Controlado</SelectItem>
              </SelectContent>
            </Select>
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
              {formErrors.categoria && (
                <span className="text-sm text-red-700 ml-2">{formErrors.categoria}</span>
              )}
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
              {formErrors.presentacion && (
                <span className="text-sm text-red-700 ml-2">{formErrors.presentacion}</span>
              )}
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
              {formErrors.precio_real && (
                <span className="text-sm text-red-700 ml-2">{formErrors.precio_real}</span>
              )}
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
              {formErrors.precio_flotante && (
                <span className="text-xs text-red-700">{formErrors.precio_flotante}</span>
              )}
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
              {formErrors.precio_blister && (
                <span className="text-sm text-red-700 ml-2">{formErrors.precio_blister}</span>
              )}
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
            {(!formData.presentacion_principal || !formData.presentacion_blister || !formData.presentacion_unidad) && (
              <p className="text-xs text-destructive">{formErrors.form ?? "Habilita al menos una presentación."}</p>
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
