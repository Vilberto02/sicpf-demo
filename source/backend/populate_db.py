import os
# pyrefly: ignore [missing-import]
import django
import random
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sicpf_core.settings')
django.setup()

from api.models import InventoryItem, Sale, Alert, Recommendation, UserProfile
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User

def populate():
    print("Limpiando base de datos...")
    InventoryItem.objects.all().delete()
    Sale.objects.all().delete()
    Alert.objects.all().delete()
    Recommendation.objects.all().delete()

    print("Insertando inventario...")
    # Insert 20 products
    for i in range(20):
        InventoryItem.objects.create(
            codigo=f"MED-{i:03d}",
            nombre=f"Medicamento de prueba {i}",
            stock_flotante=random.randint(10, 50),
            stock_real=random.randint(5, 100),
            lote=f"LOTE-{random.randint(100, 999)}",
            vencimiento=datetime.now().date() + timedelta(days=random.randint(10, 365)),
            status=random.choice(["Activo", "Por vencer", "Vencido"]),
            categoria=random.choice(["Medicamentos", "Antihistamínicos", "Antibióticos"])
        )

    print("Insertando ventas...")
    # Insert 30 sales
    for i in range(30):
        Sale.objects.create(
            codigo=f"VNT-{i:03d}",
            cliente=f"Cliente {i}",
            monto=round(random.uniform(10.0, 500.0), 2),
            fecha=datetime.now().date() - timedelta(days=random.randint(0, 150)),
            status=random.choice(["Completado", "Pendiente", "Cancelado"]),
            vendedor=f"Vendedor {random.randint(1, 3)}"
        )

    print("Insertando alertas...")
    # Insert 10 alerts
    for i in range(10):
        Alert.objects.create(
            producto=f"Producto {i}",
            categoria=random.choice(["Medicamentos", "Antihistamínicos"]),
            stock_actual=random.randint(0, 20),
            stock_minimo=random.randint(15, 30),
            fecha=datetime.now().date(),
            periodo_agotamiento=f"{random.randint(1, 10)} días",
            tendencia_consumo=random.choice(["Alta", "Moderada", "Baja"]),
            status=random.choice(["Alto", "Medio", "Bajo"])
        )
    
    print("Insertando recomendaciones...")
    for i in range(5):
        Recommendation.objects.create(
            title=f"Recomendación {i}",
            description="Esta es una recomendación generada automáticamente basada en el consumo."
        )
    
    print("Verificando usuario admin...")
    admin_user = User.objects.filter(username="admin@example.com").first()
    if admin_user:
        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                'role': 'Control de Calidad',
                'location': 'San Miguel',
                'employee_id': 'EMP-2024-001'
            }
        )

    print("¡Base de datos poblada exitosamente!")

if __name__ == '__main__':
    populate()
