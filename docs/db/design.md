# Diseño de la base de datos

### Diagrama Entidad-Relación

```mermaid
erDiagram
    CATEGORIA ||--o{ PRODUCTO : contiene
    UNIDAD_MEDIDA ||--o{ PRODUCTO : clasifica
    PRODUCTO ||--o{ LOTE : tiene
    PRODUCTO ||--o{ PREDICCION_ML : "analizado en"
    PRODUCTO ||--o{ ALERTA : genera
    PRODUCTO ||--o{ RECOMENDACION : recibe
    PREDICCION_ML ||--o{ ALERTA : fundamenta
    PREDICCION_ML ||--o{ RECOMENDACION : fundamenta
    USUARIO }|--|| ROL : tiene
    USUARIO }|--|| SEDE : "pertenece a"
    VENTA }|--|| CLIENTE : "realizada a"
    VENTA }|--|| USUARIO : "realizada por (Vendedor)"
    VENTA ||--|{ DETALLE_VENTA : incluye
    PRODUCTO ||--o{ DETALLE_VENTA : "es parte de"
    LOTE ||--o{ DETALLE_VENTA : provee

    CATEGORIA {
        int id PK
        string nombre
    }

    UNIDAD_MEDIDA {
        int id PK
        string nombre
        string abreviatura
    }
    
    PRODUCTO {
        int id PK
        string codigo
        string nombre
        string descripcion
        decimal precio_real
        decimal precio_flotante
        int unidades_por_caja
        int unidades_por_blister
        int blisters_por_caja
        string estado
        int unidad_medida_id FK
        int categoria_id FK
    }

    LOTE {
        int id PK
        string codigo_lote
        date fecha_vencimiento
        int stock_real
        int stock_flotante
        int producto_id FK
    }

    PREDICCION_ML {
        int id PK
        date fecha_prediccion
        decimal probabilidad_agotamiento
        string tendencia_consumo
        string version_modelo
        int producto_id FK
    }

    ALERTA {
        int id PK
        string alerta
        string nivel_riesgo
        int periodo_agotamiento
        int stock_minimo
        date fecha_alerta
        int producto_id FK
        int prediccion_id FK
    }

    RECOMENDACION {
        int id PK
        string titulo
        string descripcion
        int producto_id FK
        int prediccion_id FK
    }

    CLIENTE {
        int id PK
        string nombre
        string apellido
        string email
        string telefono
    }

    SEDE {
        int id PK
        string nombre
        string direccion
    }

    USUARIO {
        int id PK
        string nombre
        string apellido
        string email
        string telefono
        string direccion
        int rol_id FK
        int sede_id FK
    }

    ROL {
        int id PK
        string nombre
        string descripcion
    }

    VENTA {
        int id PK
        string codigo
        date fecha
        decimal total
        string estado
        int cliente_id FK
        int usuario_id FK "vendedor_id"
    }

    DETALLE_VENTA {
        int id PK
        int cantidad_real
        int cantidad_flotante
        decimal precio_real
        decimal precio_flotante
        int venta_id FK
        int producto_id FK
        int lote_id FK
    }
```

### Entidades

- Producto:
  - id
  - codigo
  - nombre
  - descripcion
  - precio_real
  - precio_flotante
  - unidades_por_caja (factor de conversión principal)
  - unidades_por_blister (factor de conversión blister)
  - blisters_por_caja (factor de conversión caja)
  - categoria_id
  - estado: "activo", "por vencer", "vencido"
  - unidad_medida_id (referencia al catálogo UnidadMedida)
- Lote:
  - id
  - producto_id
  - codigo_lote
  - fecha_vencimiento
  - stock_real
  - stock_flotante
- Categoria:
  - id
  - nombre
- UnidadMedida:
  - id
  - nombre
  - abreviatura
- Sede:
  - id
  - nombre
  - direccion
- PrediccionML:
  - id
  - producto_id
  - fecha_prediccion
  - probabilidad_agotamiento
  - tendencia_consumo: "alta", "moderada", "baja"
  - version_modelo
- Recomendacion:
  - id
  - producto_id
  - prediccion_id (opcional)
  - titulo
  - descripcion
- Alerta:
  - id
  - producto_id
  - prediccion_id (opcional)
  - alerta
  - nivel_riesgo
  - periodo_agotamiento (en días)
  - stock_minimo
  - fecha_alerta
- Cliente:
  - id
  - nombre
  - apellido
  - email
  - telefono
- Usuario:
  - id
  - nombre
  - apellido
  - email
  - telefono
  - direccion
  - rol_id
  - sede_id
- Rol:
  - id
  - nombre
  - descripcion
  - permisos (Relación M2M nativa con auth_permission)
- Venta:
  - id
  - codigo
  - cliente_id (referencia obligatoria a un Cliente, pudiendo usar uno Genérico)
  - usuario_id
  - fecha
  - total
  - estado: "cancelado", "completado", "finalizado"
- Detalle Venta:
  - id
  - venta_id
  - producto_id
  - lote_id
  - cantidad_real
  - cantidad_flotante
  - precio_real
  - precio_flotante

### Relaciones

- Una **Categoria** contiene muchos **Productos** (1 a N).
- Una **UnidadMedida** clasifica muchos **Productos** (1 a N).
- Un **Producto** tiene muchos **Lotes** (1 a N).
- Un **Producto** genera muchas **Alertas** (1 a N).
- Un **Producto** recibe muchas **Recomendaciones** (1 a N).
- Un **Producto** es analizado en muchas **Predicciones ML** (1 a N).
- Una **PrediccionML** fundamenta muchas **Alertas** (1 a N).
- Una **PrediccionML** fundamenta muchas **Recomendaciones** (1 a N).
- Un **Rol** pertenece a muchos **Usuarios** (1 a N).
- Una **Sede** aloja a muchos **Usuarios** (1 a N).
- Un **Cliente** tiene muchas **Ventas** (1 a N).
- Un **Usuario** (Vendedor) realiza muchas **Ventas** (1 a N).
- Una **Venta** incluye muchos **Detalles de Venta** (1 a N).
- Un **Producto** es parte de muchos **Detalles de Venta** (1 a N).
- Un **Lote** provee a muchos **Detalles de Venta** (1 a N).

### Restricciones

- `precio_real` y `precio_flotante` (en `Producto` y `Detalle Venta`) no pueden ser negativos (`>= 0`).
- `stock_real`, `stock_flotante` (en `Lote`) no pueden ser negativos (`>= 0`).
- `stock_minimo` (en `Alerta`) no puede ser negativo (`>= 0`).
- `cantidad_real` y `cantidad_flotante` (en `Detalle Venta`) no pueden ser negativos (`>= 0`).
- `email` (en `Cliente` y `Usuario`) debe ser único (`UNIQUE`).
