import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Trash2, Save, Printer, UserPlus, Handbag } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getLoteCatalogo } from "@/features/inventory/api";
import { useClientStore } from "@/features/clients/store";
import { useSalesStore } from "@/features/sales/store";
import { useAuthStore } from "@/features/auth/store";
import type { LoteType } from "@/types/types";
import type { ClienteType } from "@/features/clients/types";
import { ClienteSchema } from "@/features/clients/schemas";
import { CreateSaleSchema } from "@/features/sales/schemas";
import { SearchableSelect } from "../common/SearchableSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type CartItem = {
  id: string;
  lote: LoteType;
  qty: number;
  type: "Caja" | "Unidad" | "Blíster";
};

const CATALOG_SKELETON_ROWS = 6;

function CatalogRowSkeleton() {
  return (
    <div className="flex flex-col xl:flex-row justify-between xl:items-center p-4 gap-4">
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56 max-w-full" />
        <div className="flex flex-wrap gap-2 mt-1">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-[70px] rounded-md" />
        <Skeleton className="h-8 w-[84px] rounded-md" />
        <Skeleton className="h-8 w-[64px] rounded-md" />
      </div>
    </div>
  );
}

function NewSaleSectionSkeleton() {
  return (
    <div className="flex flex-col gap-6 min-w-0 pb-10" aria-hidden="true">
      <div className="flex items-center gap-4">
        <div className="flex gap-3 items-center">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-8 items-start">
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-full" />
          <div className="mt-2 border rounded-md divide-y divide-border overflow-hidden">
            {Array.from({ length: CATALOG_SKELETON_ROWS }).map((_, i) => (
              <CatalogRowSkeleton key={i} />
            ))}
          </div>
        </div>

        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl p-6 flex flex-col gap-4 h-full">
          <Skeleton className="h-6 w-40" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="border rounded-md mt-2 overflow-hidden">
            <div className="flex bg-muted/50 border-b px-3 py-3 gap-4">
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center px-3 py-3 gap-4">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 p-3 bg-muted/30 rounded-lg">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-10 w-full mt-2" />
        </div>
      </div>
    </div>
  );
}

export function NewSaleSection({ onBack }: { onBack: () => void }) {
  const { clients, fetchClients, addClient, loading: clientsLoading } = useClientStore();
  const { addItem: addSale } = useSalesStore();
  const { userProfile } = useAuthStore();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lotes, setLotes] = useState<LoteType[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [selectedClient, setSelectedClient] = useState<ClienteType | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [newClientData, setNewClientData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const fetchCatalog = useCallback(async (search?: string) => {
    setCatalogLoading(true);
    try {
      const data = await getLoteCatalogo({ page_size: 100, search: search || undefined });
      setLotes(data.results);
    } catch (error) {
      console.error(error);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
    fetchClients();
  }, [fetchCatalog, fetchClients]);

  const handleCatalogSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      fetchCatalog(value);
    }, 300);
    setDebounceTimer(timer);
  }, [debounceTimer, fetchCatalog]);

  if (clientsLoading) {
    return <NewSaleSectionSkeleton />;
  }

  const getStockLimits = (lote: LoteType) => {
    const unidades_en_principal = Math.max(lote.unidades_por_caja, lote.blisters_por_caja * lote.unidades_por_blister);
    const total_flotante = lote.stock_flotante + (lote.stock_real * unidades_en_principal);

    return {
      "Caja": lote.stock_real + Math.floor(lote.stock_flotante / unidades_en_principal),
      "Unidad": total_flotante,
      "Blíster": Math.floor(total_flotante / (lote.unidades_por_blister || 1))
    };
  };

  const addToCart = (lote: LoteType, type: "Caja" | "Unidad" | "Blíster") => {
    setCart((prev) => {
      const cartId = `${lote.id}-${type}`;
      const existing = prev.find((item) => item.id === cartId);

      const requestedQty = existing ? existing.qty + 1 : 1;
      const limits = getStockLimits(lote);
      const stockLimit = limits[type];

      if (requestedQty > stockLimit) {
        toast.error(`Stock insuficiente de ${type}s.`);
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.id === cartId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id: cartId, lote, qty: 1, type }];
    });
    toast.success(`${lote.producto_nombre} (${type}) agregado a la canasta.`);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartId));
  };

  const updateQty = (cartId: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) => {
      const item = prev.find(i => i.id === cartId);
      if (!item) return prev;

      const limits = getStockLimits(item.lote);
      const stockLimit = limits[item.type as "Caja" | "Unidad" | "Blíster"];

      if (qty > stockLimit) {
        toast.error(`Stock insuficiente.`);
        return prev;
      }
      return prev.map((i) => (i.id === cartId ? { ...i, qty } : i));
    });
  };

  const getPrice = (item: CartItem) => {
    if (item.type === "Caja") return item.lote.precio_real;
    if (item.type === "Blíster") return item.lote.precio_blister;
    return item.lote.precio_flotante;
  };

  const total = cart.reduce((acc, item) => acc + getPrice(item) * item.qty, 0);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ClienteSchema.safeParse(newClientData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] = issue.message;
      }
      setClientErrors(fieldErrors);
      return;
    }
    setClientErrors({});
    const client = await addClient(parsed.data);
    if (client) {
      toast.success("Cliente creado y seleccionado.");
      setSelectedClient(client);
      setIsClientModalOpen(false);
      setNewClientData({ nombre: "", apellido: "", email: "", telefono: "", direccion: "" });
    }
  };

  const handleSaveSale = async () => {
    if (cart.length === 0) {
      toast.error("La canasta está vacía.");
      return;
    }
    if (!selectedClient) {
      toast.error("Debe seleccionar un cliente.");
      return;
    }

    const detalles_write = cart.map(item => ({
      producto: item.lote.producto,
      lote: item.lote.id,
      cantidad_real: item.type === "Caja" ? item.qty : 0,
      cantidad_flotante: item.type === "Unidad" ? item.qty : 0,
      cantidad_blister: item.type === "Blíster" ? item.qty : 0,
      precio_real: item.lote.precio_real,
      precio_flotante: item.lote.precio_flotante,
      precio_blister: item.lote.precio_blister,
    }));

    const saleData = {
      codigo: `VNT-${Date.now().toString().slice(-6)}`,
      cliente: selectedClient.id,
      usuario: userProfile?.id,
      total,
      fecha: new Date().toISOString().split('T')[0],
      estado: "Completado",
      detalles_write
    };

    const parsed = CreateSaleSchema.safeParse(saleData);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first ? first.message : "Los datos de la venta no son válidos.");
      return;
    }

    try {
      await addSale(saleData);
      toast.success("Venta completada exitosamente.");
      setCart([]);
      onBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Contacte a soporte";
      toast.error(`Error al registrar la venta: ${message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 min-w-0 pb-10">
      <div className="flex items-center gap-4">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
            <Handbag width={36} height={36}></Handbag>
            <h3 className="mt-1">Nueva venta</h3>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-8 items-start">
        {/* Catálogo de Productos */}
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl p-6 flex flex-col gap-4">
          <h4 className="text-xl font-semibold text-primary">Catálogo</h4>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o lote..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => handleCatalogSearch(e.target.value)}
            />
          </div>
          <div className="h-[500px] overflow-y-auto mt-2 border rounded-md divide-y">
            {catalogLoading ? (
              Array.from({ length: CATALOG_SKELETON_ROWS }).map((_, i) => (
                <CatalogRowSkeleton key={i} />
              ))
            ) : (
              <>
                {lotes.map((lote) => {
                  const limits = getStockLimits(lote);
                  const maxCajas = limits["Caja"];
                  const maxBlisters = limits["Blíster"];
                  const maxUnidades = limits["Unidad"];

                  return (
                  <div key={lote.id} className="flex flex-col xl:flex-row justify-between xl:items-center p-4 hover:bg-muted/50 transition-colors gap-4">
                    <div>
                      <p className="font-semibold text-primary">{lote.producto_nombre}</p>
                      <p className="text-xs text-muted-foreground mb-1">Lote: {lote.codigo_lote} | Vence: {lote.fecha_vencimiento} </p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs font-medium">
                        {lote.presentacion_principal !== false && (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                            Cajas: {lote.stock_real} (S/{Number(lote.precio_real || 0).toFixed(2)})
                          </span>
                        )}
                        {lote.presentacion_blister !== false && (
                          <span className="bg-purple-500/10 text-purple-600 px-2 py-1 rounded-md" title={`Total equivalente incluyendo cajas: ${maxBlisters}`}>
                            Blísters: {Math.floor(lote.stock_flotante / (lote.unidades_por_blister || 1))} (S/{Number(lote.precio_blister || 0).toFixed(2)})
                          </span>
                        )}
                        {lote.presentacion_unidad !== false && (
                          <span className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded-md" title={`Total equivalente incluyendo cajas: ${maxUnidades}`}>
                            Unds: {lote.stock_flotante} (S/{Number(lote.precio_flotante || 0).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lote.presentacion_principal !== false && (
                        <Button size="sm" onClick={() => addToCart(lote, "Caja")} className="cursor-pointer text-sm" variant="outline" disabled={maxCajas <= 0}>
                          <Plus size={12} className="mr-1" /> Caja
                        </Button>
                      )}
                      {lote.presentacion_blister !== false && (
                        <Button size="sm" onClick={() => addToCart(lote, "Blíster")} className="cursor-pointer text-sm" variant="outline" disabled={maxBlisters <= 0}>
                          <Plus size={12} className="mr-1" /> Blíster
                        </Button>
                      )}
                      {lote.presentacion_unidad !== false && (
                        <Button size="sm" onClick={() => addToCart(lote, "Unidad")} className="cursor-pointer text-sm" variant="secondary" disabled={maxUnidades <= 0}>
                          <Plus size={12} className="mr-1" /> Und
                        </Button>
                      )}
                    </div>
                  </div>
                )})}
                {lotes.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">No se encontraron productos.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Canasta de Compra */}
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl p-6 flex flex-col gap-4 h-full">
          <h4 className="text-xl font-semibold text-primary">Canasta de venta</h4>
          <div className="flex flex-col gap-3">
            <Label>Cliente</Label>
            <SearchableSelect
              items={clients}
              value={selectedClient}
              onSelect={setSelectedClient}
              getOptionLabel={(c) => `${c.nombre} ${c.apellido}`}
              getOptionSubLabel={(c) => c.email}
              filterMatch={(c, query) =>
                `${c.nombre} ${c.apellido}`.toLowerCase().includes(query.toLowerCase()) ||
                c.email.toLowerCase().includes(query.toLowerCase())
              }
              placeholder="Buscar cliente..."
              emptyMessage="No se encontraron clientes"
              actionButton={
                <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="cursor-pointer" variant="outline" size="icon" title="Agregar nuevo cliente">
                      <UserPlus size={18} />
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo cliente</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClient} className="flex flex-col gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input required value={newClientData.nombre} placeholder="Ej. Maria" onChange={e => setNewClientData({...newClientData, nombre: e.target.value})} />
                        {clientErrors.nombre && (
                          <span className="text-sm text-red-700 ml-2">{clientErrors.nombre}</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Apellido</Label>
                        <Input required value={newClientData.apellido} placeholder="Ej. Sanchez" onChange={e => setNewClientData({...newClientData, apellido: e.target.value})} />
                        {clientErrors.apellido && (
                          <span className="text-sm text-red-700 ml-2">{clientErrors.apellido}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" required value={newClientData.email} placeholder="Ej. maria@example.com" onChange={e => setNewClientData({...newClientData, email: e.target.value})} />
                      {clientErrors.email && (
                        <span className="text-sm text-red-700 ml-2">{clientErrors.email}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input value={newClientData.telefono} placeholder="Ej. 999888777" onChange={e => setNewClientData({...newClientData, telefono: e.target.value})} />
                      {clientErrors.telefono && (
                        <span className="text-sm text-red-700 ml-2">{clientErrors.telefono}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input value={newClientData.direccion} placeholder="Ej. Av. Las Vegas 123" onChange={e => setNewClientData({...newClientData, direccion: e.target.value})} />
                      {clientErrors.direccion && (
                        <span className="text-sm text-red-700 ml-2">{clientErrors.direccion}</span>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit">Guardar cliente</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
                </Dialog>
              }
            />
          </div>

          <div className="h-[300px] overflow-y-auto border rounded-md mt-2">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b sticky top-0">
                <tr>
                  <th className="px-3 py-3 font-medium">Producto</th>
                  <th className="px-3 py-3 font-medium w-[80px]">Cant.</th>
                  <th className="px-3 py-3 font-medium text-right">Subtotal</th>
                  <th className="px-3 py-3 font-medium w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-3">
                      <p className="font-medium text-sm line-clamp-1">{item.lote.producto_nombre}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.type} | S/{Number(getPrice(item)).toFixed(2)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                        className="h-8 w-16 px-2 text-center"
                      />
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      S/{(getPrice(item) * item.qty).toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive cursor-pointer" onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                      Canasta vacía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-2 p-3 bg-muted/30 rounded-lg">
            <span className="text-lg font-semibold">Total a cobrar:</span>
            <span className="text-2xl font-bold text-primary">S/{total.toFixed(2)}</span>
          </div>

          <div className="flex gap-3 mt-2">
            <Button className="flex-1 cursor-pointer" onClick={handleSaveSale}>
              <Save size={18} className="mr-2" /> Completar venta
            </Button>
            <Button variant="outline" className="flex-none hidden" title="Aún no implementado - Preparar impresión">
              <Printer size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
