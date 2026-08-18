import { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, Trash2, Save, Printer, UserPlus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { useInventoryStore } from "@/features/inventory/store";
import { useClientStore } from "@/features/clients/store";
import { useSalesStore } from "@/features/sales/store";
import { useAuthStore } from "@/features/auth/store";
import type { LoteType } from "@/types/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type CartItem = {
  id: string; // unique cart item id because same Lote can be added as Caja and Unidad
  lote: LoteType;
  qty: number;
  type: "Caja" | "Unidad";
};

export function NewSaleSection({ onBack }: { onBack: () => void }) {
  const { items: lotes, fetchItems: fetchInventory } = useInventoryStore();
  const { clients, fetchClients, addClient } = useClientStore();
  const { addItem: addSale } = useSalesStore();
  const { userProfile } = useAuthStore();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // New client form state
  const [newClientData, setNewClientData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  useEffect(() => {
    fetchInventory();
    fetchClients();
  }, [fetchInventory, fetchClients]);

  const filteredLotes = lotes.filter((l) =>
    l.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.codigo_lote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (lote: LoteType, type: "Caja" | "Unidad") => {
    setCart((prev) => {
      const cartId = `${lote.id}-${type}`;
      const existing = prev.find((item) => item.id === cartId);
      
      const requestedQty = existing ? existing.qty + 1 : 1;
      const stockLimit = type === "Caja" ? lote.stock_real : lote.stock_flotante;

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
      const stockLimit = item.type === "Caja" ? item.lote.stock_real : item.lote.stock_flotante;
      if (qty > stockLimit) {
        toast.error(`Stock insuficiente.`);
        return prev;
      }
      return prev.map((i) => (i.id === cartId ? { ...i, qty } : i));
    });
  };

  const getPrice = (item: CartItem) => {
    return item.type === "Caja" ? item.lote.precio_real : item.lote.precio_flotante;
  };

  const total = cart.reduce((acc, item) => acc + getPrice(item) * item.qty, 0);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = await addClient(newClientData);
    if (client) {
      toast.success("Cliente creado y seleccionado.");
      setSelectedClient(client.id.toString());
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
      precio_real: item.lote.precio_real,
      precio_flotante: item.lote.precio_flotante,
    }));

    const saleData = {
      codigo: `VNT-${Date.now().toString().slice(-6)}`,
      cliente: parseInt(selectedClient),
      usuario: userProfile?.id || 1, // Fallback si falla
      total,
      fecha: new Date().toISOString().split('T')[0],
      estado: "Completado",
      detalles_write
    };

    await addSale(saleData);
    toast.success("Venta completada exitosamente.");
    setCart([]);
    onBack();
  };

  return (
    <div className="flex flex-col gap-6 min-w-0 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <h3>Nueva Venta</h3>
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-[450px] overflow-y-auto mt-2 border rounded-md divide-y">
            {filteredLotes.map((lote) => (
              <div key={lote.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 hover:bg-muted/50 transition-colors gap-4">
                <div>
                  <p className="font-semibold text-primary">{lote.producto_nombre}</p>
                  <p className="text-xs text-muted-foreground mb-1">Lote: {lote.codigo_lote} | Vence: {lote.fecha_vencimiento}</p>
                  <div className="flex gap-4 text-xs font-medium">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                      Cajas: {lote.stock_real} (S/{Number(lote.precio_real || 0).toFixed(2)})
                    </span>
                    <span className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded-md">
                      Unidades: {lote.stock_flotante} (S/{Number(lote.precio_flotante || 0).toFixed(2)})
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addToCart(lote, "Caja")} variant="outline" disabled={lote.stock_real <= 0}>
                    <Plus size={16} className="mr-1" /> Caja
                  </Button>
                  <Button size="sm" onClick={() => addToCart(lote, "Unidad")} variant="secondary" disabled={lote.stock_flotante <= 0}>
                    <Plus size={16} className="mr-1" /> Und
                  </Button>
                </div>
              </div>
            ))}
            {filteredLotes.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No se encontraron productos.</p>
            )}
          </div>
        </div>

        {/* Canasta de Compra */}
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl p-6 flex flex-col gap-4">
          <h4 className="text-xl font-semibold text-primary">Canasta de Venta</h4>
          <div className="flex flex-col gap-3">
            <Label>Cliente</Label>
            <div className="flex gap-2">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre} {c.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Agregar nuevo cliente">
                    <UserPlus size={18} />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Cliente</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClient} className="flex flex-col gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input required value={newClientData.nombre} onChange={e => setNewClientData({...newClientData, nombre: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Apellido</Label>
                        <Input required value={newClientData.apellido} onChange={e => setNewClientData({...newClientData, apellido: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" required value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input value={newClientData.telefono} onChange={e => setNewClientData({...newClientData, telefono: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input value={newClientData.direccion} onChange={e => setNewClientData({...newClientData, direccion: e.target.value})} />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Guardar Cliente</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}>
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
            <span className="text-lg font-semibold">Total a Cobrar:</span>
            <span className="text-2xl font-bold text-primary">S/{total.toFixed(2)}</span>
          </div>
          
          <div className="flex gap-3 mt-2">
            <Button className="flex-1" onClick={handleSaveSale}>
              <Save size={18} className="mr-2" /> Completar Venta
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
