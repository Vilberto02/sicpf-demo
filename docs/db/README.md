# Documentación del Esquema de Base de Datos

Este documento describe la arquitectura de la base de datos del sistema de gestión farmacéutica. El diseño soporta operaciones de venta, control estricto de inventario físico fraccionado y trazabilidad de predicciones generadas por modelos de Machine Learning.

## 1. Gestión de Inventario Fraccionado

El modelo divide la conceptualización del inventario en datos maestros (`Producto`) y existencias físicas (`Lote`). Para manejar la naturaleza de los productos farmacéuticos, el stock se clasifica en dos tipos:
- **Stock Real:** Representa las unidades cerradas o empaques completos (ej. cajas, frascos sellados).
- **Stock Flotante:** Representa las unidades sueltas o fracciones provenientes de un empaque abierto (ej. pastillas sueltas o blisters individuales).

La conversión matemática entre ambos tipos está definida por los atributos `unidades_por_caja`, `unidades_por_blister` y `blisters_por_caja` en la tabla `Producto`.

### Tabla: UnidadMedida
| id | nombre | abreviatura |
|---|---|---|
| 1 | pastilla | tab |
| 2 | frasco | fco |

### Tabla: Producto
| id | codigo | nombre | precio_real | precio_flotante | unidades_por_caja | unidades_por_blister | blisters_por_caja | unidad_medida_id | categoria_id |
|---|---|---|---|---|---|---|---|---|---|
| 1 | P-001 | Paracetamol 500mg | 10.00 | 1.20 | 10 | 10 | 1 | 1 | 1 |
| 2 | J-001 | Jarabe para Tos 200ml | 15.00 | 0.00 | 1 | 1 | 1 | 2 | 2 |

### Tabla: Lote
| id | producto_id | codigo_lote | fecha_vencimiento | stock_real | stock_flotante |
|---|---|---|---|---|---|
| 1 | 1 | L-2024-X1 | 2026-12-01 | 50 | 5 |
| 2 | 2 | L-2024-Y2 | 2025-06-30 | 20 | 0 |

## 2. Transacciones y Ventas

Las transacciones de venta separan la información general (`Venta`) del desglose de productos (`Detalle_Venta`). 
Para evitar campos nulos en clientes de paso, se utiliza el patrón de "Cliente Predeterminado" asignando el ID de un registro genérico.

### Tabla: Cliente
| id | nombre | email | telefono |
|---|---|---|---|
| 1 | Venta Mostrador | mostrador@sistema.local | N/A |
| 2 | Ana Silva | ana.silva@email.com | 555-1234 |

### Tabla: Venta
| id | codigo | cliente_id | usuario_id | fecha | total | estado |
|---|---|---|---|---|---|---|
| 100 | V-001 | 1 | 5 | 2024-03-10 | 13.60 | completado |

### Tabla: Detalle_Venta
| id | venta_id | producto_id | lote_id | cantidad_real | cantidad_flotante | precio_real | precio_flotante |
|---|---|---|---|---|---|---|---|
| 1001 | 100 | 1 | 1 | 1 | 3 | 10.00 | 1.20 |

*Nota del flujo:* En el ejemplo anterior, el cliente compró 1 caja entera y 3 pastillas sueltas de Paracetamol (total $13.60). El sistema deberá descontar 1 unidad del `stock_real` y 3 unidades del `stock_flotante` en la tabla `Lote`. En caso de no existir suficiente `stock_flotante`, la lógica de la aplicación debe restar 1 unidad adicional de `stock_real`, sumar el equivalente (`unidades_por_caja`) al `stock_flotante` y proceder con la sustracción.

## 3. Modelo Analítico e Inteligencia Artificial

Las entidades relacionadas al Machine Learning funcionan como un sistema de trazabilidad. `PrediccionML` registra las salidas del modelo matemático. Las tablas operativas `Alerta` y `Recomendacion` utilizan el atributo opcional `prediccion_id` para justificar su creación automática. Si una alerta se crea por una regla estática manual, el atributo permanece nulo.

### Tabla: PrediccionML
| id | producto_id | fecha_prediccion | probabilidad_agotamiento | tendencia_consumo | version_modelo |
|---|---|---|---|---|---|
| 50 | 1 | 2024-03-10 | 0.89 | alta | v1.2 |

### Tabla: Alerta
| id | producto_id | prediccion_id | alerta | nivel_riesgo | periodo_agotamiento | stock_minimo |
|---|---|---|---|---|---|---|
| 20 | 1 | 50 | Riesgo de quiebre de stock | alto | 5 | 10 |

### Tabla: Recomendacion
| id | producto_id | prediccion_id | titulo | descripcion |
|---|---|---|---|---|
| 30 | 1 | 50 | Reposición Urgente | Generar orden de compra por 500 unidades. |

## 4. Control de Acceso

El sistema utiliza un control basado en roles para separar funciones operativas y administrativas, y permite asignar usuarios a diferentes sucursales. 

### Tabla: Rol
| id | nombre | descripción | permisos |
|---|---|---|---|
| 1 | Administrador | Acceso total | *(Relación M2M nativa con auth_permission)* |
| 2 | Vendedor | Acceso en sucursal | *(Relación M2M nativa con auth_permission)* |

### Tabla: Sede
| id | nombre | direccion |
|---|---|---|
| 1 | Sucursal Centro | Av. Principal 123 |

### Tabla: Usuario
| id | nombre | apellido | email | rol_id | sede_id |
|---|---|---|---|---|---|
| 5 | Carlos | Gómez | carlos@farmacia.local | 2 | 1 |

## Resumen del Flujo de Información

1. **Catálogo y Configuración:** El Administrador da de alta los registros en `Categoria`, `Producto` y los empleados en `Usuario`.
2. **Ingreso Físico:** Al recibir mercancía, el inventario se registra directamente en la tabla `Lote`, definiendo sus fechas de vencimiento y volúmenes de `stock_real`.
3. **Proceso de Venta:** El vendedor realiza una transacción. Se genera el encabezado en `Venta` asignando al `cliente_id` (o al cliente genérico). Se genera el `Detalle_Venta` registrando con precisión la cantidad extraída de cajas enteras (`cantidad_real`) o fracciones (`cantidad_flotante`).
4. **Actualización de Inventario:** El sistema procesa el `Detalle_Venta` y actualiza los campos de stock correspondientes en el `Lote` asignado.
5. **Análisis:** En paralelo, procesos en segundo plano leen las transacciones de ventas y el inventario restante para alimentar el modelo de Machine Learning.
6. **Emisión de Avisos:** El modelo escribe resultados en `PrediccionML`. Disparadores de software leen estos registros y generan entradas formales en `Alerta` y `Recomendacion` para notificar a la administración sobre necesidades de compra.
