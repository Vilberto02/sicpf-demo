import os
# pyrefly: ignore [missing-import]
import django
import random
from datetime import datetime, time, timedelta
from decimal import Decimal
from faker import Faker

from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sicpf_core.settings')
django.setup()

from api.models import (
    Categoria, Producto, Lote, PrediccionML, Alerta, 
    Recomendacion, Cliente, Rol, Usuario, Venta, DetalleVenta, Presentacion, Sede
)
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User

fake = Faker('es_ES')

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
    User.objects.exclude(username="admin@example.com").delete()

    print("Insertando Categorías...")
    categorias_nombres = ["Analgésicos", "Antibióticos", "Antihistamínicos", "Vitaminas", "Primeros Auxilios", "Cardiología", "Dermatología"]
    categorias = []
    for nombre in categorias_nombres:
        categorias.append(Categoria.objects.create(nombre=nombre))

    print("Insertando Presentaciones...")
    presentaciones_nombres = ["Caja", "Frasco", "Tubo", "Ampolla", "Sobre"]
    presentaciones = []
    for nombre in presentaciones_nombres:
        presentaciones.append(Presentacion.objects.create(nombre=nombre))

    print("Insertando Productos y Lotes...")
    productos = []
    medicamentos_base = [
        "Paracetamol", "Ibuprofeno", "Amoxicilina", "Omeprazol", "Losartán", 
        "Loratadina", "Diclofenaco", "Naproxeno", "Metformina", "Cetirizina", 
        "Azitromicina", "Clonazepam", "Atorvastatina", "Enalapril", "Ciprofloxacino"
    ]
    dosificaciones = ["500mg", "1g", "50mg", "20mg", "400mg", "250mg", "10mg", "100mg", "5ml"]

    for i in range(30):
        cat = random.choice(categorias)
        nombre_base = random.choice(medicamentos_base)
        dosis = random.choice(dosificaciones)
        nombre_completo = f"{nombre_base} {dosis}"

        precio_real = Decimal(round(random.uniform(10.0, 150.0), 2))
        unidades_por_caja = random.choice([1, 10, 20, 30, 50, 100])
        precio_flotante = precio_real / unidades_por_caja if unidades_por_caja > 1 else Decimal("0.00")
        
        unidades_por_blister = 10 if unidades_por_caja >= 10 else 1
        precio_blister = precio_flotante * unidades_por_blister if unidades_por_caja >= 10 else Decimal("0.00")
        
        prod = Producto.objects.create(
            codigo=fake.unique.bothify(text='PROD-####-??').upper(),
            nombre=nombre_completo,
            descripcion=fake.sentence(nb_words=12),
            precio_real=precio_real,
            precio_flotante=round(precio_flotante, 2),
            precio_blister=round(precio_blister, 2),
            unidades_por_caja=unidades_por_caja,
            unidades_por_blister=unidades_por_blister,
            blisters_por_caja=unidades_por_caja // unidades_por_blister,
            stock_minimo_real=random.randint(5, 15),
            stock_minimo_flotante=random.randint(10, 40),
            presentacion=random.choice(presentaciones),
            categoria=cat,
            presentacion_principal=True,
            presentacion_blister=(unidades_por_blister > 1),
            presentacion_unidad=(unidades_por_caja > 1)
        )
        productos.append(prod)

        # Crear 1 a 3 lotes por producto
        for j in range(random.randint(1, 3)):
            Lote.objects.create(
                producto=prod,
                codigo_lote=fake.bothify(text='LOTE-??-####').upper(),
                fecha_vencimiento=datetime.now().date() + timedelta(days=random.randint(30, 730)),
                stock_real=random.randint(0, 50),
                stock_flotante=random.randint(0, unidades_por_caja - 1) if unidades_por_caja > 1 else 0
            )

    print("Insertando Predicciones, Alertas y Recomendaciones...")
    for prod in random.sample(productos, 15):
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
            descripcion=f"Basado en el consumo reciente, se recomienda reabastecer {prod.nombre} pronto."
        )

    print("Insertando Clientes...")
    clientes = []
    # Cliente genérico
    clientes.append(Cliente.objects.create(
        nombre="Venta Mostrador",
        email="mostrador@sistema.local",
        telefono="N/A"
    ))
    for i in range(15):
        clientes.append(Cliente.objects.create(
            nombre=fake.first_name(),
            apellido=fake.last_name(),
            email=fake.unique.email(),
            telefono=fake.phone_number()
        ))

    print("Verificando Sedes, Usuario y Roles...")
    sede_central, _ = Sede.objects.get_or_create(nombre="Sede Central", direccion=fake.address().replace('\n', ', '))
    sede_norte, _ = Sede.objects.get_or_create(nombre="Sede Norte", direccion=fake.address().replace('\n', ', '))
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
                'sede': sede_central,
                'telefono': fake.phone_number(),
                'direccion': fake.address().replace('\n', ', ')
            }
        )
    else:
        usuario_admin = None
        print("Advertencia: No se encontró admin@example.com de Django Auth.")

    # Crear algunos vendedores
    vendedores = []
    if usuario_admin:
        vendedores.append(usuario_admin)

    for i in range(4):
        username = fake.unique.user_name()
        django_user, created = User.objects.get_or_create(
            username=username, 
            email=fake.unique.email(),
            first_name=fake.first_name(),
            last_name=fake.last_name()
        )
        if created:
            django_user.set_password('password123')
            django_user.save()

        vend, _ = Usuario.objects.get_or_create(
            user=django_user,
            defaults={
                'rol': rol_vendedor,
                'sede': random.choice(sedes),
                'telefono': fake.phone_number(),
                'direccion': fake.address().replace('\n', ', ')
            }
        )
        vendedores.append(vend)

    print("Insertando Ventas y Detalles...")
    for i in range(50):
        cliente = random.choice(clientes)
        vendedor = random.choice(vendedores) if vendedores else None
        
        venta = Venta.objects.create(
            codigo=f"VNT-2024-{fake.unique.random_number(digits=5, fix_len=True)}",
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
                
            cant_real = random.randint(0, 2)
            cant_blister = random.randint(0, prod.blisters_por_caja - 1) if prod.blisters_por_caja > 1 else 0
            cant_flotante = random.randint(0, prod.unidades_por_blister - 1) if prod.unidades_por_blister > 1 else 0

            # Garantizar que al menos se lleve 1 unidad de algo
            if cant_real == 0 and cant_blister == 0 and cant_flotante == 0:
                cant_real = 1
            
            subtotal = (Decimal(cant_real) * prod.precio_real) + (Decimal(cant_blister) * prod.precio_blister) + (Decimal(cant_flotante) * prod.precio_flotante)
            total_venta += subtotal
            
            DetalleVenta.objects.create(
                venta=venta,
                producto=prod,
                lote=lote,
                cantidad_real=cant_real,
                cantidad_blister=cant_blister,
                cantidad_flotante=cant_flotante,
                precio_real=prod.precio_real,
                precio_blister=prod.precio_blister,
                precio_flotante=prod.precio_flotante
            )
            
        venta.total = total_venta
        venta.save()

    print("¡Base de datos poblada exitosamente!")

if __name__ == '__main__':
    populate()
