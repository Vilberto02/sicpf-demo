import os
# pyrefly: ignore [missing-import]
import django
import random
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sicpf_core.settings')
django.setup()

from api.models import (
    Categoria, Producto, Lote, PrediccionML, Alerta, 
    Recomendacion, Cliente, Rol, Usuario, Venta, DetalleVenta, Presentacion, Sede
)
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User

def populate():
    print("Limpiando base de datos (Django ORM)...")
    DetalleVenta.objects.all().delete()
    Venta.objects.all().delete()
    Recomendacion.objects.all().delete()
    Alerta.objects.all().delete()
    PrediccionML.objects.all().delete()
    Lote.objects.all().delete()
    Producto.objects.all().delete()
    Presentacion.objects.all().delete()
    Categoria.objects.all().delete()
    Cliente.objects.all().delete()
    Usuario.objects.all().delete()
    Rol.objects.all().delete()
    Sede.objects.all().delete()

    print("Insertando Categorías...")
    categorias_nombres = ["Analgésicos", "Antibióticos", "Antihistamínicos", "Vitaminas", "Primeros Auxilios"]
    categorias = []
    for nombre in categorias_nombres:
        categorias.append(Categoria.objects.create(nombre=nombre))

    print("Insertando Presentaciones...")
    presentaciones_nombres = ["pastilla", "frasco", "blister", "tubo", "caja"]
    presentaciones = []
    for nombre in presentaciones_nombres:
        presentaciones.append(Presentacion.objects.create(nombre=nombre))

    print("Insertando Productos y Lotes...")
    productos = []
    for i in range(20):
        cat = random.choice(categorias)
        precio_real = Decimal(round(random.uniform(5.0, 100.0), 2))
        unidades_por_caja = random.choice([1, 10, 20, 30])
        precio_flotante = precio_real / unidades_por_caja if unidades_por_caja > 1 else Decimal("0.00")
        
        prod = Producto.objects.create(
            codigo=f"PROD-{i:03d}",
            nombre=f"{cat.nombre} Genérico {i}",
            descripcion=f"Descripción de prueba para producto {i}",
            precio_real=precio_real,
            precio_flotante=precio_flotante,
            unidades_por_caja=unidades_por_caja,
            unidades_por_blister=10 if unidades_por_caja >= 10 else 1,
            blisters_por_caja=unidades_por_caja // 10 if unidades_por_caja >= 10 else 1,
            stock_minimo_real=random.randint(5, 15),
            stock_minimo_flotante=random.randint(10, 40),
            presentacion=random.choice(presentaciones),
            categoria=cat
        )
        productos.append(prod)

        # Crear 1 a 3 lotes por producto
        for j in range(random.randint(1, 3)):
            Lote.objects.create(
                producto=prod,
                codigo_lote=f"LOTE-{prod.id}-{j}",
                fecha_vencimiento=datetime.now().date() + timedelta(days=random.randint(30, 730)),
                stock_real=random.randint(0, 50),
                stock_flotante=random.randint(0, unidades_por_caja - 1) if unidades_por_caja > 1 else 0
            )

    print("Insertando Predicciones, Alertas y Recomendaciones...")
    for prod in random.sample(productos, 10):
        prediccion = PrediccionML.objects.create(
            producto=prod,
            fecha_prediccion=datetime.now().date(),
            probabilidad_agotamiento=Decimal(round(random.uniform(0.5, 0.99), 4)),
            tendencia_consumo=random.choice(["alta", "moderada"]),
            version_modelo="v1.0"
        )
        
        Alerta.objects.create(
            producto=prod,
            prediccion=prediccion,
            alerta=f"Posible quiebre de stock para {prod.nombre}",
            nivel_riesgo=random.choice(["alto", "medio"]),
            periodo_agotamiento=random.randint(5, 15),
            stock_minimo=prod.stock_minimo_real,
            stock_minimo_flotante=prod.stock_minimo_flotante,
            fecha_alerta=datetime.now().date()
        )

        Recomendacion.objects.create(
            producto=prod,
            prediccion=prediccion,
            titulo=f"Comprar {prod.nombre}",
            descripcion="Basado en el consumo reciente, se recomienda reabastecer pronto."
        )

    print("Insertando Clientes...")
    clientes = []
    # Cliente genérico
    clientes.append(Cliente.objects.create(
        nombre="Venta Mostrador",
        email="mostrador@sistema.local",
        telefono="N/A"
    ))
    for i in range(5):
        clientes.append(Cliente.objects.create(
            nombre=f"ClienteName{i}",
            apellido=f"Apellido{i}",
            email=f"cliente{i}@email.com",
            telefono=f"555-000{i}"
        ))

    print("Verificando Sedes, Usuario y Roles...")
    sede_central, _ = Sede.objects.get_or_create(nombre="Sede Central", direccion="Av. Principal 1")
    sede_norte, _ = Sede.objects.get_or_create(nombre="Sede Norte", direccion="Av. Norte 2")
    sedes = [sede_central, sede_norte]

    rol_admin, _ = Rol.objects.get_or_create(nombre="Administrador", descripcion="Acceso total")
    rol_vendedor, _ = Rol.objects.get_or_create(nombre="Vendedor", descripcion="Acceso a ventas")

    admin_django_user = User.objects.filter(username="admin@example.com").first()
    if admin_django_user:
        if not admin_django_user.first_name:
            admin_django_user.first_name = "Admin"
            admin_django_user.last_name = "Sistema"
            admin_django_user.save()
        usuario_admin, _ = Usuario.objects.get_or_create(
            user=admin_django_user,
            defaults={
                'rol': rol_admin,
                'sede': sede_central
            }
        )
    else:
        # Create a dummy user object if we don't have django user yet just for sales logic
        usuario_admin = None
        print("Advertencia: No se encontró admin@example.com de Django Auth.")

    # Crear algunos vendedores si no hay
    vendedores = []
    if usuario_admin:
        vendedores.append(usuario_admin)

    for i in range(2):
        django_user, created = User.objects.get_or_create(username=f"vendedor{i}", email=f"vendedor{i}@local.com")
        if created:
            django_user.set_password('password123')
            django_user.save()

        vend, _ = Usuario.objects.get_or_create(
            user=django_user,
            defaults={
                'rol': rol_vendedor,
                'sede': random.choice(sedes)
            }
        )
        vendedores.append(vend)

    print("Insertando Ventas y Detalles...")
    for i in range(30):
        cliente = random.choice(clientes)
        vendedor = random.choice(vendedores) if vendedores else None
        
        venta = Venta.objects.create(
            codigo=f"VNT-2024-{i:04d}",
            cliente=cliente,
            usuario=vendedor,
            fecha=timezone.make_aware(
                datetime.combine(
                    datetime.now().date() - timedelta(days=random.randint(0, 150)),
                    time.min,
                )
            ),
            total=Decimal("0.00"),
            estado=random.choice(["Completado", "Completado", "Pendiente", "Cancelado"])
        )
        
        total_venta = Decimal("0.00")
        
        # 1 a 4 productos por venta
        for _ in range(random.randint(1, 4)):
            prod = random.choice(productos)
            lote = prod.lotes.first()
            if not lote:
                continue
                
            cant_real = random.randint(1, 3)
            cant_flotante = random.randint(0, prod.unidades_por_caja - 1) if prod.unidades_por_caja > 1 else 0
            
            subtotal = (Decimal(cant_real) * prod.precio_real) + (Decimal(cant_flotante) * prod.precio_flotante)
            total_venta += subtotal
            
            DetalleVenta.objects.create(
                venta=venta,
                producto=prod,
                lote=lote,
                cantidad_real=cant_real,
                cantidad_flotante=cant_flotante,
                precio_real=prod.precio_real,
                precio_flotante=prod.precio_flotante
            )
            
        venta.total = total_venta
        venta.save()

    print("¡Base de datos poblada exitosamente!")

if __name__ == '__main__':
    populate()
