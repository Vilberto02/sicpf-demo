# Backend SICPF Demo

Este directorio contiene el backend del Sistema Integrado de Control de Productos Farmacéuticos (SICPF), construido con Django y Django REST Framework (DRF). Utiliza JSON Web Tokens (JWT) para la autenticación y SQlite como base de datos por defecto para facilitar el desarrollo local.

## Requisitos Previos

* Python 3.10 o superior
* pip (gestor de paquetes de Python)
* virtualenv (recomendado para aislar dependencias)

## Instalacion y Configuracion Local

Siga estos pasos para configurar y ejecutar el proyecto en un entorno de desarrollo local.

1. **Crear y activar un entorno virtual:**

   En Windows:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

   En macOS y Linux:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Instalar dependencias:**
   Con el entorno virtual activado, instale los paquetes requeridos definidos en `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```

## Base de Datos y Poblacion de Datos

El proyecto utiliza SQLite (`db.sqlite3`) para el desarrollo local. 

1. **Aplicar migraciones:**
   Cree las tablas necesarias en la base de datos ejecutando:
   ```bash
   python manage.py migrate
   ```

2. **Poblar la base de datos (Mock Data):**
   Para tener un entorno de pruebas con datos ficticios (categorias, productos, ventas, usuarios), ejecute el script proporcionado:
   ```bash
   python populate_db.py
   ```
   *Nota: Este script limpia la base de datos existente (usando el ORM de Django) antes de insertar los nuevos datos, por lo que puede usarse para reiniciar el estado de prueba en cualquier momento.*

## Ejecucion del Servidor de Desarrollo

Una vez configurada la base de datos, inicie el servidor de desarrollo de Django:
```bash
python manage.py runserver
```
El backend estara disponible en `http://127.0.0.1:8000/`. Puede probar los endpoints de la API agregando el prefijo `/api/`, por ejemplo: `http://127.0.0.1:8000/api/productos/`.

## Ejecucion de Pruebas Unitarias

Para garantizar la estabilidad del codigo y la proteccion de las rutas (JWT), se han implementado pruebas unitarias. Para ejecutarlas, utilice el siguiente comando:
```bash
python manage.py test api
```

## Estructura del Proyecto

* **api/models.py**: Define la estructura relacional de la base de datos (Categoria, Producto, Lote, Venta, etc.).
* **api/serializers.py**: Controla la transformacion de los modelos de Django a JSON (y viceversa).
* **api/services.py**: Contiene la logica de negocio y el acceso a los datos aislandolo de las vistas.
* **api/views.py**: Expone los endpoints de la API utilizando las vistas genericas de DRF.
* **api/urls.py**: Enruta las peticiones web hacia las vistas correspondientes.
* **api/tests.py**: Contiene las pruebas automatizadas del proyecto.
* **populate_db.py**: Script utilitario para inyectar datos de prueba en la base de datos local.

## Identidad del negocio y tickets de demostración

SICPF es independiente de cualquier farmacia. Para configurar una instalación:

1. Ejecute las migraciones y cree un administrador con `python manage.py createsuperuser`.
2. Ingrese a `/admin/` y abra **Configuración del Negocio**. Edite el registro activo; si no existe, cree uno.
3. Complete nombre comercial, razón social, RUC y dirección para salir del modo de demostración. Puede configurar ubicación, contacto, logo, serie, moneda y mensajes del ticket.
4. Deje la URL de consulta vacía si no dispone de un servicio propio. El crédito predeterminado es «Generado por SICPF».

Sin los cuatro campos de identificación completos, o si falla la consulta a la API, se imprime **TICKET DE DEMOSTRACIÓN — SIN VALIDEZ TRIBUTARIA**, sin identificación empresarial ni QR tributario. La configuración completa conserva el formato de boleta; configurar estos datos no implementa envío ni autorización ante SUNAT.

### Instalaciones existentes

Las migraciones actualizan los valores predeterminados, pero conservan los registros guardados. Revise todos los registros de negocio, incluidos los inactivos, y retire nombres, RUC, direcciones, logos, enlaces y mensajes que pertenezcan a una empresa anterior. Para una demo, use SICPF como nombre comercial, deje vacía la identificación y use un agradecimiento neutral. Revise también sedes y perfiles si contienen información real.

No use el script de población para limpiar una instalación con datos que deba conservar. Las bases remotas y los despliegues existentes se administran por separado; este cambio no los modifica.
