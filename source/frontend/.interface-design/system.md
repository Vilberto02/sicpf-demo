# Interface Design System: SICPF

## Intent & Feel
- **Human:** Administrador de farmacia, vendedor rápido bajo presión.
- **Task:** Gestionar alertas de inventario, realizar ventas rápidas.
- **Feel:** "Precisión Clínica". Higiénico, confiable, médico. Denso en datos (tablas), con aire en métricas de alto nivel.

## Foundations
- **Typeface:** Sora. Ocupa bastante espacio horizontal, por lo que compensaremos con ritmos densos (tabular-nums) para datos y uso intensivo de `font-medium` (500) y `font-semibold` (600) en lugar de crecer el tamaño en píxeles.
- **Depth Strategy:** Sombras sutiles (layered shadows) en tarjetas y modales, combinadas con bordes casi invisibles `rgba(0,0,0,0.06)`. NADA de bordes gruesos de colores como `border-neutral-400`.
- **Palette (Color World):**
  - Superficies: Blanco hueso de fondo `oklch(0.985 0 0)`, blanco puro en tarjetas.
  - Primario: Teal médico (`#016B61`).
  - Acentos: Sólo para indicar estado (Warning/Danger/Success) en alertas e inventario caducado.

## Hierarchy & Spacing
- **Base Unit:** 4px.
- **Densidad:** `px-4 py-6` para contenedores anchos; `gap-4` estructural. 
- **Focal Points:** Un solo Héroe por tarjeta (el número del dato, no el título).

## Key Patterns
- **CardDashboard:** `bg-white shadow-sm ring-1 ring-black/5 rounded-xl px-5 py-6`.
  - Héroe (Valor): `text-4xl font-semibold text-primary tabular-nums tracking-tight`.
  - Etiqueta (Título): `text-sm font-medium text-muted-foreground`.
- **SideBar:** `bg-white border-r border-black/5` (sin sombras duras).
