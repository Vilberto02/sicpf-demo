# Roles y Permisos — SICPF

Especificación de restricciones por rol. Solo documenta; no implementa.

## 1. Resumen de roles

| Rol | Alcance |
| :--- | :--- |
| **Administrador** | Acceso total al programa (todas las secciones, acciones y datos del negocio). |
| **Vendedor** | Acceso restringido bajo el principio de mínimo privilegio. |

El rol Administrador equivale a `is_superuser` o dueño del negocio en las vistas protegidas (`permissions.py` → `IsOwnerOrAdmin`).

---

## 2. Matriz de permisos (Vendedor vs Administrador)

Leyenda: PERMITIDO · PROHIBIDO · CONDICIONAL

### 2.1 General (Dashboard)

| Acción | Administrador | Vendedor | Notas |
| :--- | :--- | :--- | :--- |
| Visualizar gráfico de barras | PERMITIDO | PROHIBIDO | Componente en la sección general (`components/charts/BarChart.tsx`). El endpoint que lo alimenta debe devolver 403 para Vendedor. |

### 2.2 Inventario — Lotes

| Acción | Administrador | Vendedor | Notas |
| :--- | :--- | :--- | :--- |
| Visualizar lotes | PERMITIDO | PERMITIDO | Excepto la tarjeta "Valorización del inventario" (`InventorySection.tsx:48`). |
| Visualizar tarjeta de valorización | PERMITIDO | PROHIBIDO | Ocultar en UI y proteger el dato en backend. |
| Crear lote | PERMITIDO | PERMITIDO | Creación de lote vía API de inventario. |
| Visualizar detalle de lote | PERMITIDO | PERMITIDO | Modal `LoteDetailsModal.tsx` / `LoteSheet.tsx`. |
| Editar lote | PERMITIDO | PROHIBIDO | |
| Eliminar lote | PERMITIDO | PROHIBIDO | |

### 2.3 Inventario — Productos

| Acción | Administrador | Vendedor | Notas |
| :--- | :--- | :--- | :--- |
| Visualizar productos | PERMITIDO | PERMITIDO | |
| Ver detalle de producto | PERMITIDO | PERMITIDO | |
| Agregar producto | PERMITIDO | PROHIBIDO | |
| Editar producto | PERMITIDO | PROHIBIDO | |
| Eliminar producto | PERMITIDO | PROHIBIDO | |

### 2.4 Ventas

| Acción | Administrador | Vendedor | Notas |
| :--- | :--- | :--- | :--- |
| Visualizar historial de ventas | PERMITIDO (todo el negocio) | CONDICIONAL (solo del usuario) | Filtrar por `Venta.usuario` = perfil del usuario (`models.py:253`). |
| Ver detalle de venta | PERMITIDO | PERMITIDO | |
| Imprimir venta | PERMITIDO | PERMITIDO | |
| Anular venta | PERMITIDO | CONDICIONAL (solo propias) | Cambio de estado a "Cancelado"; restringir al `Venta.usuario` del autenticado. |
| Agregar venta | PERMITIDO | PERMITIDO | |
| Agregar cliente | PERMITIDO | PERMITIDO | |
| Visualizar clientes | PERMITIDO | PERMITIDO (todos) | Ve el catálogo completo de clientes. |
| Estadísticas de ventas | PERMITIDO (todo el negocio) | CONDICIONAL (solo del usuario) | Mismo filtrado por propietario. |

### 2.5 Alertas

| Acción | Administrador | Vendedor | Notas |
| :--- | :--- | :--- | :--- |
| Visualizar/listar alertas | PERMITIDO | PERMITIDO | Cubierto por permisos `view_*`. |
| Ver detalle de alerta | PERMITIDO | PERMITIDO | |
| Generar alerta | PERMITIDO | PROHIBIDO | |
| Marcar como revisada | PERMITIDO | PROHIBIDO | |
| Descartar alerta | PERMITIDO | PROHIBIDO | |

### 2.6 Recomendaciones

| Acción | Administrador | Vendedor | Notas |
| :--- | :--- | :--- | :--- |
| Visualizar recomendaciones | PERMITIDO | PERMITIDO (solo lectura) | Cubierto por `view_*`. |
| Crear / editar / eliminar | PERMITIDO | PROHIBIDO | |

### 2.7 Panel de administración (gestión de usuarios / roles)

| Acción | Administrador | Vendedor | Notas |
| :--- | :--- | :--- | :--- |
| Acceder al panel (`UsersSection`) | PERMITIDO | PROHIBIDO | Solo Administrador o dueño del negocio (`IsOwnerOrAdmin`). |

---

## 3. Mapeo a la arquitectura actual y brechas

El sistema delega permisos en Django a través de `api/permissions.py`:

- `asegurar_permisos_base(rol)`: Administrador recibe todos los permisos de modelo de la app `api`; cualquier otro rol recibe solo los que empiezan por `view`.
- `IsOwnerOrAdmin`: protege la gestión de usuarios/roles para superuser o rol "Administrador".

### Brechas detectadas

| Requisito de la matriz | Estado actual | Qué falta |
| :--- | :--- | :--- |
| Vendedor crea lotes, ventas y clientes | No cubierto (solo `view_*`) | Capacidad explícita de creación por rol. |
| Vendedor anula ventas (solo propias) | No cubierto | Permiso de anulación + filtro por `Venta.usuario`. |
| Ventas/estadísticas solo del usuario | No cubierto (`view_sales` da todas) | Filtrado de queryset por `request.user.usuario_perfil`. |
| Ocultar gráfico de barras / valorización / panel admin | Solo UI | Gate backend (403) en los endpoints correspondientes. |
| Alertas solo lectura | Cubierto por `view_*` | Ocultar botones de acción en UI. |
| Recomendaciones solo lectura | Cubierto por `view_*` | — |

### Diseño recomendado

1. Matriz de capacidades por rol (feature flags) en lugar de depender solo de permisos de modelo de Django. Claves propuestas:
   - `inventory.lot.create`, `inventory.lot.view`, `inventory.lot.view_valuation`, `inventory.lot.edit`
   - `inventory.product.view`, `inventory.product.create/edit/delete`
   - `sales.view_own`, `sales.create`, `sales.annul_own`, `sales.stats_own`, `client.create`, `client.view_all`
   - `alerts.view`, `alerts.create/review/dismiss`
   - `recommendations.view`
   - `admin.panel`
2. Filtrado row-level para ventas: `Venta.objects.filter(usuario=request.user.usuario_perfil)` cuando el rol es Vendedor.
3. Gates en backend para las secciones de UI (bar chart, valorización, panel admin) además del ocultamiento en el front.

---

## 4. Notas de seguridad

- Ocultar un componente en el frontend no es seguridad. Los endpoints que sirven el gráfico de barras, la valorización del inventario y el panel de administración deben responder 403 para el rol Vendedor.
- El filtrado "solo mis ventas" debe hacerse en el servidor (queryset), no recortando la lista en el cliente.
- El alta de lote por el Vendedor no debe exponer ni calcular datos de costo/valorización.

---

## 5. Decisiones resueltas

| Tema | Decisión |
| :--- | :--- |
| Anular venta | Solo las propias (filtrado por `Venta.usuario`). |
| Recomendaciones | Vendedor: solo lectura. |
| Visibilidad de clientes | Vendedor ve todos los clientes y puede crear. |

---

## 6. Pendientes de implementación

- Definir y persistir la matriz de capacidades por rol.
- Añadir filtrado por propietario en las vistas/servicios de ventas y estadísticas.
- Añadir gates de backend para bar chart, valorización y panel de administración.
- Deshabilitar u ocultar los botones de acción prohibidos en la UI (editar lote/producto, generar/marcar/descartar alerta, panel admin, gráfico de barras).
