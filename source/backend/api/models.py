# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=100, default='Usuario')
    location = models.CharField(max_length=100, default='Sede Central')
    employee_id = models.CharField(max_length=50, default='EMP-000-000')

    def __str__(self):
        return f"Perfil de {self.user.username}"


class InventoryItem(models.Model):
    STATUS_CHOICES = (
        ('Activo', 'Activo'),
        ('Por vencer', 'Por vencer'),
        ('Vencido', 'Vencido'),
    )
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    stock_flotante = models.IntegerField()
    stock_real = models.IntegerField()
    lote = models.CharField(max_length=100)
    vencimiento = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    categoria = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'Artículos de inventario'
        verbose_name = 'Artículo de inventario'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Sale(models.Model):
    STATUS_CHOICES = (
        ('Completado', 'Completado'),
        ('Pendiente', 'Pendiente'),
        ('Cancelado', 'Cancelado'),
    )
    codigo = models.CharField(max_length=50, unique=True)
    cliente = models.CharField(max_length=200)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    vendedor = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'Ventas'
        verbose_name = 'Venta'

    def __str__(self):
        return f"Venta {self.codigo} - {self.cliente}"

class Alert(models.Model):
    TENDENCIA_CHOICES = (
        ('Alta', 'Alta'),
        ('Moderada', 'Moderada'),
        ('Baja', 'Baja'),
    )
    STATUS_CHOICES = (
        ('Alto', 'Alto'),
        ('Medio', 'Medio'),
        ('Bajo', 'Bajo'),
    )
    producto = models.CharField(max_length=200)
    categoria = models.CharField(max_length=100)
    stock_actual = models.IntegerField()
    stock_minimo = models.IntegerField()
    fecha = models.DateField()
    periodo_agotamiento = models.CharField(max_length=50)
    tendencia_consumo = models.CharField(max_length=20, choices=TENDENCIA_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    class Meta:
        verbose_name_plural = 'Alertas'
        verbose_name = 'Alerta'

    def __str__(self):
        return f"Alerta {self.producto} ({self.status})"

class Recommendation(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()

    class Meta:
        verbose_name_plural = 'Recomendaciones'
        verbose_name = 'Recomendación'

    def __str__(self):
        return self.title
