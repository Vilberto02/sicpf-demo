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
