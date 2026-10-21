# Esquema y reglas de datos

Este documento describe las entidades y operaciones actuales de SICPF. El [diagrama y diccionario](design.md) detalla los campos persistidos; la [documentación de la API](../README.md) explica acceso, rutas y respuestas.

La fuente de verdad es [api/models.py](../../source/backend/api/models.py), junto con las [migraciones](../../source/backend/api/migrations), los [serializers](../../source/backend/api/serializers.py) y los [servicios](../../source/backend/api/services.py). SQLite es la base local predeterminada; PostgreSQL se configura mediante `DATABASE_URL`.

## Entidades

| Área | Entidades y función |
| --- | --- |
| Catálogos | `Categoria`, `Presentacion`, `Marca` y `FormaFarmaceutica`. |
| Productos | `Producto`: identidad, información farmacéutica, precios, factores de conversión y mínimos. |
| Existencias | `Lote`: producto, vencimiento, cantidades, marca y clasificación de marca o genérico. |
| Operaciones | `Cliente`, `Venta`, `DetalleVenta` y `MetodoPago`. |
| Acceso y sedes | `Usuario`, vinculado a `auth.User`; `Rol`, con permisos de Django; `Sede`. |
| Alertas y análisis | `Alerta`, `PrediccionML` y `Recomendacion`. |
| Configuración y trazabilidad | `Negocio` y `RegistroAuditoria`. |

`UnidadMedida` no existe en el esquema actual. `Presentacion` contiene `nombre` y una `abreviatura` opcional. Los campos `estado` de productos y lotes son propiedades calculadas, no columnas.

## Inventario fraccionado y ventas

El producto contiene datos maestros; cada lote almacena existencias físicas:

- `stock_real`: cantidad de presentaciones principales cerradas, por ejemplo cajas o frascos.
- `stock_flotante`: cantidad de unidades mínimas sueltas. Los blísteres se convierten a estas unidades; no existe una columna `stock_blister`.
- `unidades_por_caja`, `unidades_por_blister` y `blisters_por_caja`: factores definidos en `Producto`.
- `presentacion_principal`, `presentacion_blister` y `presentacion_unidad`: opciones de presentación del producto.

En la creación de ventas se calcula:

```text
unidades_por_presentacion = max(unidades_por_caja,
                                blisters_por_caja * unidades_por_blister)
unidades_sueltas_requeridas = cantidad_flotante
                              + cantidad_blister * unidades_por_blister
subtotal_linea = cantidad_real * precio_real
                 + cantidad_blister * precio_blister
                 + cantidad_flotante * precio_flotante
```

Si faltan unidades sueltas, se abren presentaciones principales disponibles sin consumir las reservadas por `cantidad_real`. Si aun así el stock no alcanza, se rechaza la transacción. Los detalles repetidos sobre un mismo lote se acumulan en la comprobación de disponibilidad.

### Ejemplo consistente

Datos ficticios: producto con caja de 100 unidades, blíster de 10 unidades, `precio_real=10.00`, `precio_blister=1.20` y `precio_flotante=0.12`. Los precios se configuran por presentación; no se exige que el precio de una caja coincida con el de todas sus unidades por separado.

| Caso | Stock inicial: cajas / unidades | Venta | Stock final: cajas / unidades | Total |
| --- | --- | --- | --- | --- |
| Unidades suficientes | 50 / 5 | 1 caja y 3 unidades | 49 / 2 | S/10.36 |
| Apertura de caja | 50 / 0 | 1 caja y 3 unidades | 48 / 97 | S/10.36 |
| Blíster | 50 / 5 | 1 blíster | 49 / 95 | S/1.20 |

### Creación y anulación

La lógica transaccional se ejecuta en `VentaSerializer.create()`:

1. Exige al menos un detalle y un cliente existente. El registro «Venta Mostrador» es un dato de demostración, no un cliente creado o asignado automáticamente por el serializer.
2. Asigna el perfil del usuario autenticado y, si no se envía sede, usa la del perfil. Si no se envía método de pago, busca Efectivo activo o el primer método activo.
3. Completa serie y correlativo cuando corresponde; el código de venta es único. No existe una restricción única compuesta sobre serie y correlativo.
4. Bloquea los lotes con `select_for_update` dentro de `transaction.atomic`, rechaza lotes vencidos y stock insuficiente, y calcula precios y total en el servidor. La efectividad del bloqueo de filas depende de la base de datos; SQLite no ofrece el mismo bloqueo que PostgreSQL.
5. Para un total mayor a S/700, la validación implementada exige un DNI de cliente de ocho dígitos. Esta es una descripción del código, no una certificación de cumplimiento tributario.
6. Guarda la venta, sus detalles, el nuevo stock y un evento de auditoría.

Los estados persistidos de `Venta` son **`Pendiente`**, **`Completado`** y **`Cancelado`**, respetando mayúsculas. El único tipo de comprobante configurado en el modelo es `Boleta`.

La transición a `Cancelado`, autorizada para administradores, repone `cantidad_real` en cajas y `cantidad_flotante + cantidad_blister * unidades_por_blister` en unidades sueltas. Repetir el mismo estado no vuelve a reponer. La representación resultante de cajas abiertas puede diferir del stock original, conservando las unidades equivalentes.

El DELETE de una venta elimina físicamente encabezado y detalles mediante `VentaService`, sin ejecutar la reposición de la anulación. No debe utilizarse como sinónimo de cancelar. El alta descuenta stock independientemente del estado enviado; los cambios entre otros estados no implementan una nueva salida de stock.

## Campos persistidos y calculados

| Modelo | Datos calculados o añadidos a la respuesta, sin columna propia |
| --- | --- |
| `Producto` | `estado`, `tipo_producto`, `marcas_disponibles` y nombres relacionados del serializer. |
| `Lote` | `estado`; el serializer añade estado e información del producto, precios, factores y nombre de marca. |
| `Venta` | `op_gravada = total / 1.18`, `igv = total - op_gravada` y `subtotal = op_gravada`, con redondeo a dos decimales. |
| `Usuario` | `nombre`, `apellido` y `email` proceden de `auth.User`; `is_active` en la respuesta también corresponde al usuario Django. |
| `Alerta` | Explicación y lotes afectados calculados al serializar; `estado_prioridad` es una anotación de consulta. |

Un lote está `vencido` si su vencimiento es hoy o anterior, `por vencer` si faltan de 1 a 15 días, y `activo` en los demás casos. El estado de producto se deriva de sus lotes con stock: vencido si todos están vencidos, por vencer si alguno está por vencer, y activo en los demás casos. Esta propiedad recorre los lotes sin un filtro propio de `is_active`; no debe confundirse con la desactivación lógica.

## Alertas y análisis

`AlertGenerationService.generate_all()` ejecuta reglas síncronas y reemplaza las alertas pendientes de origen `reglas` de cada producto. Conserva alertas revisadas, descartadas y de otros orígenes.

| Regla | Comportamiento implementado |
| --- | --- |
| Stock crítico | Cajas o unidades sueltas menores o iguales a su mínimo; riesgo alto. |
| Stock bajo | Si no es crítico, cajas o unidades menores o iguales al 150% de su mínimo; riesgo medio. |
| Vencimiento | Una alerta por lote vencido o a 15 días o menos de vencer; riesgo alto o medio, respectivamente. |
| Quiebre estimado | Cobertura de 15 días o menos y existencia de lotes con fecha de vencimiento de hoy o posterior; riesgo alto hasta 7 días, medio en los demás casos. |

El consumo promedio usa detalles de ventas `Completado` de los últimos 30 días, convertidos a unidades mínimas y divididos entre 30. La cobertura es la parte entera de stock equivalente dividido entre consumo; sin consumo se usa el valor convencional 999.

El generador actual recorre todos los productos y sus lotes sin filtrar `is_active`, y suma también el stock de lotes vencidos para el cálculo de stock y cobertura. La selección FEFO y el filtrado de catálogos tienen reglas diferentes; no se debe atribuir al generador un filtro de inventario vendible que no tiene.

`Alerta` admite estados `pendiente`, `revisada`, `descartada`; orígenes `reglas`, `ml`, `manual`; y tipos `stock_critico`, `stock_bajo`, `vencimiento`, `quiebre`. El vínculo con `PrediccionML` es opcional. No hay FK directa de alerta a lote: el texto puede mencionar un lote y el serializer consulta los lotes actuales del producto.

`PrediccionML` y `Recomendacion` permiten almacenar resultados y sugerencias asociados al producto. El script de población inserta ejemplos simulados. El repositorio no incluye entrenamiento, inferencia programada, Celery/Beat ni generación automática de recomendaciones al ejecutar las reglas.

## Acceso, eliminación y restricciones

`Usuario.user` es una relación uno a uno obligatoria con `auth.User`. Rol y sede son opcionales. Nombre, apellido, email, contraseña y estado de acceso pertenecen al usuario Django, no se duplican en el perfil. El serializer comprueba emails de perfiles sin distinguir mayúsculas; no existe un `UNIQUE` de email en `auth.User` equivalente al de `Cliente.email`.

Los roles se relacionan con `auth.Permission` mediante M2M y se sincronizan con grupos. La API usa clases de permisos propias y comprobaciones de propietario; esa relación M2M no sustituye las comprobaciones reales de cada endpoint. Consulte la [matriz de acceso actual](../README.md#rutas-de-la-api).

- DELETE de producto lo desactiva junto con sus lotes; DELETE de lote o método de pago desactiva solo ese registro.
- Otras entidades usan borrado físico, sujeto a `CASCADE`, `PROTECT` y `SET_NULL`. El [diccionario](design.md) indica la política por relación.
- Marcar una alerta como descartada actualiza su estado; DELETE elimina la fila.
- El esquema declara unicidad en códigos de producto y venta, nombres de presentación, marca, forma farmacéutica y método de pago, email de cliente y la relación uno a uno del perfil. El código de lote y el RUC no son únicos.
- No hay `CheckConstraint` ni validadores mínimos declarados en estos modelos para garantizar importes, cantidades o stock no negativos. Las comprobaciones de formularios y serializers son otra capa y no deben presentarse como restricciones SQL.
- `choices` define valores admitidos por formularios y serializers; no equivale por sí mismo a una restricción `CHECK` de base de datos.

## Negocio y auditoría

`Negocio` almacena identidad, ubicación, contacto, logo y opciones de tickets. `get_solo()` usa el primer registro activo o crea uno neutral. La aplicación lo trata como configuración única, pero no existe una restricción SQL que impida múltiples registros activos. `Venta` no tiene FK a `Negocio` ni guarda una instantánea de su identidad: la impresión consulta la configuración actual.

Los valores predeterminados son SICPF, identificación y ubicación vacías, «¡GRACIAS POR SU COMPRA!» y «Generado por SICPF». La migración de valores neutrales no borra datos empresariales ya guardados. El administrador debe revisar los registros existentes.

Sin nombre comercial, razón social, RUC o dirección, la impresión es de demostración sin validez tributaria y omite identificación y QR tributario. No hay un servicio de envío o autorización de comprobantes ante SUNAT.

`RegistroAuditoria` referencia opcionalmente a `auth.User` y guarda acción, tabla y registro afectados, detalles JSON, IP, agente de usuario y fecha. La eliminación del usuario conserva el evento con usuario nulo. La auditoría se registra en puntos concretos de servicios, serializers y middleware; no es un historial automático completo de cada modificación del ORM.
