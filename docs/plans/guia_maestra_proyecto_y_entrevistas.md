# Guía Maestra del Proyecto SICPF: Arquitectura, Backend, Frontend, Despliegue y Preparación para Entrevistas

Este documento consolida **todo el conocimiento técnico, decisiones de diseño, patrones de arquitectura, resolución de problemas en servidores y prácticas de ingeniería de software** implementadas en el proyecto **SICPF** (Sistema Integral de Control y Predicción Farmacéutica). 

Está diseñado como tu **manual de referencia y entrenamiento para entrevistas técnicas** para roles de **Fullstack Developer**, **Backend Developer (Python/Django)** o **Frontend Developer (React/TypeScript)**.

---

## 1. Visión Global del Sistema y Arquitectura

### 1.1 Objetivo del Negocio y Dominio Farmacéutico
SICPF automatiza y optimiza los procesos internos de una cadena de farmacias (caso Boticas Perú):
* **Gestión de Stock Dual/Triple:** Los productos se venden en tres modalidades: **Caja cerrada** (`stock_real`), **Blíster** (`precio_blister`), y **Unidad mínima o pastilla** (`stock_flotante`). La plataforma calcula automáticamente equivalencias, conversiones y quiebres de stock.
* **Control FEFO (*First Expired, First Out*):** Priorización de despacho según fecha de vencimiento para minimizar mermas.
* **Motor de Alertas y Pronósticos:** Detección de productos en riesgo de agotamiento (por velocidad de consumo) y lotes próximos a vencer.

### 1.2 Diagrama de Arquitectura de Extremo a Extremo

```mermaid
graph TB
    subgraph "Cliente (Navegador)"
        UI["React 19 + Vite SPA<br/>(Tailwind CSS v4 + Radix UI)"]
        State["Zustand Stores<br/>(Auth, Inventory, Sales, Alerts)"]
        Client["apiClient (Fetch + Queue 401)"]
    end

    subgraph "Render Edge / CDN"
        CDN["Render Static Site Router<br/>(Rewrite Rule: /* → /index.html)"]
    end

    subgraph "Render Web Service (Backend)"
        WSGI["Gunicorn HTTP Server"]
        WhiteNoise["WhiteNoise Middleware<br/>(Static Assets Cache)"]
        Security["CORS & CSRF Middlewares<br/>(Sanitized Origins)"]
        DRF["Django REST Framework<br/>(SimpleJWT + Throttling)"]
        Services["Service Layer (BaseService)<br/>(Business Logic & Query Optimization)"]
        ORM["Django ORM"]
    end

    subgraph "Neon Cloud"
        Postgres[("PostgreSQL Serverless<br/>(Pooled Connection - SSL Require)")]
    end

    UI --> State
    State --> Client
    Client -->|HTTPS Requests| CDN
    CDN -->|API Calls /api/*| WSGI
    WSGI --> WhiteNoise
    WhiteNoise --> Security
    Security --> DRF
    DRF --> Services
    Services --> ORM
    ORM -->|TCP / SSL (Port 5432)| Postgres
```

---

## 2. Módulo Backend (Django + DRF + PostgreSQL)

### 2.1 Patrón de Arquitectura: *Service Layer* (*Fat Services, Thin Views*)
En lugar de saturar las vistas (`views.py`) o los modelos (`models.py`) con lógica de negocio pesada, se implementó el **Patrón de Capa de Servicios**:
* **`models.py`:** Define estrictamente el esquema de datos, relaciones e integridad referencial.
* **`serializers.py`:** Actúa como capa de validación de entrada/salida y transformación a JSON (*Data Transfer Object*).
* **`services.py`:** Orquesta la lógica de negocio, cálculos de ventas, rotación de lotes, reglas de stock y consultas complejas a la base de datos. Hereda de un `BaseService` con métodos genéricos (`get_queryset`, `create`, `update`, `delete`).
* **`views.py`:** Controladores HTTP delgados; reciben la petición, delegan al servicio y retornan la respuesta (`Response`).

### 2.2 Optimización de Consultas ORM: Solución al Problema $N+1$
Un error común en entrevistas es no saber optimizar consultas relacionales. Si tienes 100 productos y cada uno consulta su categoría y presentación en bucle, se generan 201 consultas SQL ($N+1$).

En [services.py](file:///source/backend/api/services.py) lo resolvimos con:
* **`select_related('categoria', 'presentacion')`:** Realiza un `INNER JOIN` o `LEFT OUTER JOIN` en una sola consulta SQL para relaciones de clave foránea uno a uno o muchos a uno.
* **`prefetch_related('lotes')`:** Realiza una segunda consulta SQL agrupada con `IN (...)` y combina los datos en memoria en Python, ideal para relaciones uno a muchos o muchos a muchos.
* **Anotaciones y Expresiones Condicionales:**
  ```python
  .annotate(
      estado_prioridad=Case(
          When(estado='pendiente', then=Value(1)),
          When(estado='revisada', then=Value(2)),
          When(estado='descartada', then=Value(3)),
          default=Value(4),
          output_field=IntegerField()
      )
  ).order_by('estado_prioridad', '-created_at')
  ```
  Esto delega el ordenamiento complejo al motor de base de datos en lugar de ordenar arrays gigantescos en la memoria del servidor.

### 2.3 Autenticación JWT y Modelo de Usuario Desacoplado
* **Autenticación SimpleJWT:** Se implementó autenticación con tokens de corta duración (`ACCESS_TOKEN_LIFETIME = 180 min`) y tokens de refresco (`REFRESH_TOKEN_LIFETIME = 1 día`).
* **Perfil Delgado (*Thin User Profile*):** 
  * Fuente de verdad de identidad: Modelo nativo `django.contrib.auth.models.User` (username, email, password, first_name, last_name).
  * Datos del dominio farmacéutico: Modelo `Usuario` vinculado mediante `OneToOneField(User)` (sede, rol, teléfono, dirección).
  * **Sincronización de Permisos (RBAC):** Migración [`0016_usuario_perfil_delgado.py`](file:///source/backend/api/migrations/0016_usuario_perfil_delgado.py) que vincula automáticamente los permisos del `Rol` con los grupos nativos de Django (`auth_group`), garantizando seguridad a nivel de permisos de base de datos.

### 2.4 Lecciones Críticas de Migraciones: El Incidente PostgreSQL vs SQLite

> [!CAUTION]
> **Pregunta típica de entrevista:** *"¿Qué diferencias críticas hay entre SQLite y PostgreSQL en Django y qué errores has solucionado al migrar de local a producción?"*

* **El Problema:** La migración [`0015_normalizar_venta_fecha.py`](file:///source/backend/api/migrations/0015_normalizar_venta_fecha.py) ejecutaba la consulta SQL:
  ```sql
  SELECT id FROM api_venta WHERE LENGTH(fecha) = 10;
  ```
  En **SQLite**, las fechas se guardan como cadenas de texto (`TEXT`), por lo que `LENGTH()` funciona.
  En **PostgreSQL (Neon)**, el campo `fecha` es un `timestamp with time zone` nativo. En PostgreSQL, la función `LENGTH()` no existe para tipos de datos temporales, provocando un fallo total del build en Render:
  `django.db.utils.ProgrammingError: function length(timestamp with time zone) does not exist`.
* **La Solución:** Condicionar la ejecución según el dialecto del motor de base de datos:
  ```python
  if schema_editor.connection.vendor != 'sqlite':
      return  # En PostgreSQL las fechas son nativas; omitir normalización de texto
  ```
* **Buenas Prácticas para Migraciones en Producción:**
  1. **Evitar SQL crudo dependiente de vendor** en migraciones `RunPython`/`RunSQL`.
  2. **Nunca hacer cambios destructivos directos** en producción (ej. renombrar columnas o borrar campos en el mismo paso); usar el patrón *Expand and Contract* (crear nueva columna, migrar datos, eliminar columna vieja en versión posterior).
  3. **Comprobar la conexión con `--dry-run`** antes de aplicar migraciones críticas.

---

## 3. Módulo Frontend (React 19 + TypeScript + Vite + Zustand)

### 3.1 Arquitectura Modular *Feature-First (Vertical Slice)*
En lugar de agrupar por tipo de archivo (`/components`, `/hooks`, `/services`), el frontend se organiza por dominio de negocio en [`source/frontend/src/features/`](file:///source/frontend/src/features/):
```text
features/
├── auth/            # store, api, types, schemas, tokens
├── inventory/       # stock de productos y lotes
├── sales/           # carrito de venta, emisión de comprobantes
├── alerts/          # alertas de rotación y vencimiento
└── products/        # catálogo y presentaciones
```
**Ventaja:** Alta cohesión y bajo acoplamiento. Modificar la lógica de ventas no afecta inventario ni autenticación.

### 3.2 Manejo de Estado Global con Zustand
Se eligió **Zustand** sobre Redux o React Context por:
1. **Rendimiento:** No requiere envolver la aplicación en múltiples `<Context.Provider>`, evitando re-renderizados innecesarios de componentes hijos.
2. **Boilerplate mínimo:** Stores atómicos y fáciles de testear.
3. **Selectores atómicos:** Los componentes solo se re-renderizan si la propiedad específica seleccionada (`state.isAuthenticated`) cambia.

### 3.3 Cliente API Resiliente: Silent Refresh y Cola de Peticiones Concurrente
En [`source/frontend/src/lib/apiClient.ts`](file:///source/frontend/src/lib/apiClient.ts) se implementó una de las piezas más avanzadas del proyecto:

```typescript
// Prevención de condiciones de carrera en 401 simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];
```

#### ¿Cómo funciona este algoritmo?
1. Si un usuario tiene la pantalla abierta y se disparan 4 peticiones a la vez (inventario, alertas, estadísticas, ventas) cuando el `access token` acaba de expirar, todas reciben un `401 Unauthorized`.
2. Sin una cola, el cliente dispararía 4 peticiones simultáneas a `/auth/token/refresh/`, invalidando tokens y cerrando la sesión del usuario por desincronización (*race condition*).
3. **Nuestra solución:**
   * La **primera** petición activa `isRefreshing = true` e inicia el refresco de token.
   * Las otras 3 peticiones se apilan en `failedQueue` como promesas en espera.
   * Al recibir el nuevo token, `processQueue` despierta y resuelve todas las peticiones encoladas con el nuevo token, reintentándolas sin que el usuario note ninguna interrupción.
   * Si el refresh token falló (sesión expirada), limpia el storage y emite el evento global `auth:session-expired`.

### 3.4 El Desafío del SPA Routing en Sitios Estáticos
* En desarrollo con Vite, el servidor local intercepta cualquier URL (`/inventario`, `/ventas`) y entrega `index.html`.
* En producción (Render Static Site), si un usuario pulsa F5 o entra directo a `https://tu-app.onrender.com/inventario`, el servidor web de Render busca físicamente un archivo llamado `/inventario`. Como no existe, arroja **404 Not Found**.
* **Solución:** Configuración de la regla de reescritura:
  * Tipo: `Rewrite`
  * Origen: `/*`
  * Destino: `/index.html`

---

## 4. Despliegue, Infraestructura y DevOps (Render + Neon)

### 4.1 Topología de Despliegue Costo-Eficiente (Free Tier Ready)
* **Neon:** Base de datos relacional PostgreSQL con auto-suspend a cero tras inactividad y reconexión inmediata (~500ms).
* **Render Web Service (Backend):** Servidor Linux con Python 3.11 gestionado mediante Gunicorn (4 workers recomendados en producción) y WhiteNoise para archivos estáticos.
* **Render Static Site (Frontend):** Distribuido mediante CDN global, altamente optimizado con compresión Gzip/Brotli.

### 4.2 Servido de Archivos Estáticos: WhiteNoise vs Nginx
En producción, Django desactiva el servido de archivos estáticos por seguridad cuando `DEBUG = False`.
* Tradicionalmente se requiere un servidor proxy inverso como Nginx o un bucket S3.
* Con **WhiteNoise**, Django sirve sus propios archivos estáticos directamente desde Python de forma eficiente:
  * Recopila con `python manage.py collectstatic --no-input`.
  * Genera hashes en los nombres de archivo (`styles.a8f23bc.css`) mediante `CompressedManifestStaticFilesStorage`.
  * Inyecta cabeceras HTTP de caché infinita (`Cache-Control: max-age=31536000, immutable`), reduciendo el consumo de ancho de banda a cero tras la primera carga.

### 4.3 CORS y Sanitización de Orígenes Defensiva

> [!IMPORTANT]
> **Incidente Real Solucionado:** `(corsheaders.E014) Origin 'https://sicpf-demo.onrender.com/' should not have path`.
> * La especificación del navegador define un `Origin` como `protocolo + dominio + puerto opcional` (sin barras diagonales ni rutas al final).
> * En [`settings.py`](file:///source/backend/sicpf_core/settings.py) implementamos una **defensa en profundidad** mediante `.rstrip('/')`:
>   ```python
>   CORS_ALLOWED_ORIGINS = [
>       o.strip().rstrip('/') for o in CORS_ORIGINS_ENV.split(',') if o.strip()
>   ]
>   ```
>   Esto garantiza que, independientemente de errores humanos al tipear la URL en las variables de entorno de Render, la aplicación jamás sufra caídas en el build.

### 4.4 Infraestructura como Código: [render.yaml](file:///render.yaml)
Permite reproducir todo el ecosistema (Web Service, Static Site, variables de entorno, comandos de compilación y reglas de reescritura) en un solo clic mediante **Render Blueprints**, garantizando paridad de entornos y despliegues reproducibles.

---

## 5. Banco de 15 Preguntas Técnicas para Entrevistas Laborales

Usa estas preguntas para simular entrevistas técnicas. Cada una incluye la respuesta modelo respaldada por tu experiencia en este proyecto.

### Pregunta 1: ¿Por qué utilizaste una arquitectura con *Service Layer* en lugar de colocar la lógica en las vistas o en los modelos?
> **Respuesta:**  
> "Adopté el patrón de capa de servicios para respetar el principio de responsabilidad única (SRP). En Django, colocar lógica en las vistas (*Fat Views*) dificulta la reutilización cuando se exponen endpoints adicionales o tareas en segundo plano (Celery). Por otro lado, saturar los modelos (*Fat Models*) rompe el desacoplamiento con el ORM. Al aislar la lógica de cálculo de stock, rotación de lotes y validaciones de venta en un `Service Layer`, las vistas quedan como controladores limpios, los serializadores se dedican solo a validar formato JSON y las pruebas unitarias de negocio se pueden ejecutar de forma aislada y rápida."

### Pregunta 2: ¿Cómo enfrentas el problema del N+1 en un ORM relacional?
> **Respuesta:**  
> "El problema del N+1 ocurre cuando se accede a relaciones en un bucle generando una consulta SQL por cada elemento. En este proyecto lo resolví usando `select_related` para relaciones `ForeignKey` directas (como `Producto` con `Categoria` y `Presentacion`), generando un solo `JOIN` en base de datos. Para relaciones inversas o de muchos a muchos (como los lotes de cada producto), utilicé `prefetch_related`, que ejecuta dos consultas optimizadas con un `WHERE id IN (...)` y reconstruye la relación en memoria en Python. Con esto reduje el tiempo de respuesta del catálogo de inventario drásticamente."

### Pregunta 3: ¿Qué ocurre cuando un Access Token JWT expira en el frontend mientras el usuario está usando la aplicación?
> **Respuesta:**  
> "Implementé un mecanismo de *Silent Refresh* con una cola de peticiones concurrentes en `apiClient.ts`. Si varias peticiones disparadas a la vez reciben un `401 Unauthorized`, un flag (`isRefreshing`) asegura que solo la primera haga el llamado a `/auth/token/refresh/`. Las demás peticiones se encolan como promesas. Cuando el nuevo access token se recibe, se reintentan automáticamente todas las peticiones pausadas con el nuevo encabezado `Authorization: Bearer <token>`. Si el refresh token también expiró, se limpia el almacenamiento y se dispara un evento para redirigir al usuario al login de forma controlada."

### Pregunta 4: Cuéntame de algún error imprevisto que hayas enfrentado al desplegar a producción y cómo lo diagnosticaste.
> **Respuesta:**  
> "Al pasar de SQLite en desarrollo a PostgreSQL en Neon para producción, el build en Render falló durante las migraciones con el error `django.db.utils.ProgrammingError: function length(timestamp with time zone) does not exist`. Analizando los logs, identifiqué que una migración de datos contenía un `SELECT ... WHERE LENGTH(fecha) = 10` pensado para normalizar fechas en SQLite, que almacena fechas como cadenas de texto. En PostgreSQL, el campo es un tipo nativo `timestamp with time zone` y no soporta `LENGTH()`. Lo resolví inspeccionando el dialecto con `schema_editor.connection.vendor != 'sqlite'`, de modo que en PostgreSQL la operación se omite de forma transparente."

### Pregunta 5: ¿Por qué en un Single Page Application (SPA) de React aparece error 404 al recargar una página en producción, y cómo se soluciona?
> **Respuesta:**  
> "Porque React Router utiliza la API HTML5 History (`pushState`), manipulando la URL en el cliente sin recargar el navegador. Cuando el usuario presiona F5 en una ruta como `/inventario`, el servidor web de producción (como el CDN de Render) busca físicamente una carpeta o archivo con ese nombre y devuelve 404. La solución es configurar una regla de reescritura en el servidor web que redirija cualquier ruta (`/*`) hacia `/index.html` con un rewrite transparente, permitiendo que la aplicación React cargue y resuelva la ruta internamente."

### Pregunta 6: ¿Cómo funciona CORS y por qué puede fallar la configuración en Django?
> **Respuesta:**  
> "CORS es una política de seguridad del navegador que bloquea peticiones HTTP entre diferentes orígenes a menos que el servidor incluya cabeceras específicas (`Access-Control-Allow-Origin`). En Django utilizamos `django-cors-headers`. Un error común que experimentamos y solucionamos fue `corsheaders.E014`, causado por configurar un origen con una barra final (`https://dominio.com/`). La especificación exige únicamente protocolo y host. Para evitar que errores tipográficos en variables de entorno tiren el servidor, apliqué sanitización defensiva en `settings.py` utilizando `.rstrip('/')` al procesar los orígenes."

### Pregunta 7: ¿Qué estrategia utilizas para realizar migraciones de base de datos sin tiempo de inactividad (*Zero-Downtime*)?
> **Respuesta:**  
> "Utilizo el patrón *Expand and Contract*. Si necesito modificar o renombrar una columna, primero creo la nueva columna como opcional (Expand), despliego una versión del código que escribe en ambas columnas pero lee de la nueva, ejecuto un script de migración de datos históricos en segundo plano, y finalmente en una versión posterior elimino la columna antigua (Contract). Además, en bases de datos relacionales en la nube, evito operaciones que adquieran bloqueos de tabla exclusivos (`ACCESS EXCLUSIVE locks`), ejecutando las migraciones en momentos de bajo tráfico o mediante herramientas como pgroll."

### Pregunta 8: ¿Por qué elegiste Zustand en lugar de Redux Toolkit o React Context?
> **Respuesta:**  
> "Para este sistema, Redux Toolkit agregaba excesivo código repetitivo (slices, dispatchers, reducers) que ralentizaba el desarrollo. Por otro lado, React Context causa re-renderizados innecesarios en todos los componentes consumidores cada vez que el valor del contexto cambia, lo que requería memorizaciones complejas con `useMemo` y `useCallback`. Zustand ofrece una API limpia basada en hooks, soporte directo de selectores atómicos fuera del árbol de React y excelente rendimiento sin necesidad de providers."

### Pregunta 9: ¿Cómo serviste los archivos estáticos en Django sin usar un servidor Nginx en Render?
> **Respuesta:**  
> "Utilicé WhiteNoise configurado en el middleware de Django. Durante el build de Render, `collectstatic` reúne los estáticos del admin, Jazzmin y DRF en una carpeta raíz. WhiteNoise los comprime con gzip/Brotli y genera un manifiesto con hashes únicos para cada archivo (`CompressedManifestStaticFilesStorage`). Esto permite a la aplicación de Django servir sus propios estáticos con cabeceras de caché inmutable de máximo rendimiento, eliminando la necesidad de configurar y pagar por un proxy Nginx o un bucket S3 para sitios de mediana escala."

### Pregunta 10: ¿Cómo proteges un flujo de recuperación de contraseña contra ataques de seguridad?
> **Respuesta:**  
> "Implementé 3 niveles de defensa:  
> 1. **Anti-enumeración de usuarios:** El endpoint de solicitud siempre retorna `200 OK` con un mensaje neutro (*'Si el correo está registrado, se envió un enlace'*), impidiendo que un atacante descubra qué correos existen.  
> 2. **Tokens criptográficos temporales:** Empleo `default_token_generator` de Django, que crea un hash criptográfico HMAC que incluye el timestamp y el hash de la contraseña actual del usuario. Esto garantiza que el enlace expire en 1 hora y quede automáticamente invalidado tan pronto como la contraseña se modifique.  
> 3. **Rate Limiting:** Restricción estricta de solicitudes por IP (ej. 5 peticiones por hora) con `AnonRateThrottle` para evitar saturación del servicio de correos."

### Pregunta 11: ¿Cómo manejas las diferencias de zonas horarias entre clientes y base de datos?
> **Respuesta:**  
> "En el backend configuré `USE_TZ = True` con la zona horaria del negocio (`TIME_ZONE = 'America/Lima'`). En la base de datos PostgreSQL, los registros de ventas y auditoría se almacenan en UTC (`timestamptz`). Al consultar métricas o generar agrupaciones de fechas (como ventas por día o mes), se utiliza `timezone.make_aware()` o funciones de Django como `TruncDay` para asegurar que las fechas se agrupen con base en la hora local y no en UTC, evitando discrepancias de facturación a la medianoche."

### Pregunta 12: ¿Qué es el *Connection Pooling* y por qué es vital en una base de datos Serverless como Neon?
> **Respuesta:**  
> "Cada conexión nueva a PostgreSQL crea un proceso en el sistema operativo del servidor de base de datos, lo que consume memoria y tiempo de CPU (aprox. 10MB por conexión). En arquitecturas serverless o con muchas peticiones concurrentes, abrir y cerrar conexiones satura rápidamente el límite de conexiones del motor. Un Connection Pooler (como PgBouncer en Neon) mantiene un conjunto de conexiones abiertas persistentes y las reutiliza para atender transacciones rápidamente, reduciendo la latencia y previniendo caídas por 'too many connections'."

### Pregunta 13: ¿Cómo optimizaste el tamaño y tiempo de carga del bundle de JavaScript en Vite?
> **Respuesta:**  
> "Implementé *Code Splitting* y carga diferida (*Lazy Loading*) usando `React.lazy` y `Suspense` para todas las rutas principales (`LoginPage`, `InventorySection`, `SaleSection`). De esta forma, el navegador solo descarga el código JavaScript correspondiente a la pantalla que el usuario está viendo, manteniendo el archivo inicial en menos de 130 kB gzippeado en lugar de un bundle monolítico de varios megabytes."

### Pregunta 14: ¿Cómo estructuras tu flujo de trabajo en Git cuando trabajas en equipo?
> **Respuesta:**  
> "Utilizo una estrategia basada en ramas cortas (*Trunk-based development* con ramas de feature). Cada cambio se asocia a un requerimiento específico con commits convencionales (`feat:`, `fix:`, `refactor:`, `chore:`). Antes de fusionar a la rama principal (`main`), se ejecutan las pruebas automatizadas del backend (`manage.py test`) y el linter y build del frontend (`npm run build`). Una vez validado el Pull Request, el merge a `main` dispara el despliegue continuo (CI/CD) automático en Render."

### Pregunta 15: Si el servidor backend reporta que la aplicación está caída o lenta tras un despliegue, ¿cuál es tu procedimiento de diagnóstico?
> **Respuesta:**  
> "Sigo un protocolo sistemático de 4 pasos:  
> 1. **Revisión de Logs en Tiempo Real:** Inspeccionar los logs de Render para identificar excepciones no capturadas, fallos en migraciones o errores de inicio de Gunicorn.  
> 2. **Estado de la Base de Datos:** Verificar métricas de Neon (consumo de CPU, conexiones activas y estado de reposo/auto-suspend).  
> 3. **Verificación de Variables de Entorno y Secretos:** Confirmar que `DATABASE_URL`, `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` estén correctamente asignadas.  
> 4. **Prueba Aislada con Curl:** Enviar una petición directa al endpoint de salud o `/api/schema/` para descartar bloqueos de CORS o problemas en el cliente frontend antes de analizar el código."

---

## 6. Resumen de Habilidades Técnicas a Destacar en tu CV

```text
Backend:      Python 3.11/3.14, Django 5.2, Django REST Framework, SimpleJWT, Gunicorn, WhiteNoise.
Frontend:     React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, React Router v7, React Hook Form, Zod.
Bases Datos:  PostgreSQL (Neon Serverless), SQLite, Optimización ORM (select_related, prefetch_related, indexing).
Cloud/DevOps: Render (Web Services & Static Sites), Infrastructure as Code (render.yaml), CI/CD, Git.
Seguridad:    RBAC, CORS, CSRF, Password Hashing (PBKDF2), Rate Limiting, User Enumeration Prevention.
```
