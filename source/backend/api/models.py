# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User, Permission
# pyrefly: ignore [missing-import]
from django.utils import timezone

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'Categorías'
        verbose_name = 'Categoría'

    def __str__(self):
        return self.nombre

class UnidadMedida(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    abreviatura = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Unidades de Medida'
        verbose_name = 'Unidad de Medida'

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    ESTADO_CHOICES = (
        ('activo', 'Activo'),
        ('por vencer', 'Por vencer'),
        ('vencido', 'Vencido'),
    )
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    precio_real = models.DecimalField(max_digits=10, decimal_places=2, help_text="Precio de la caja")
    precio_flotante = models.DecimalField(max_digits=10, decimal_places=2, help_text="Precio de 1 unidad minima (ej. pastilla)")
    precio_blister = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Precio de 1 blister")
    unidades_por_caja = models.IntegerField(default=1)
    unidades_por_blister = models.IntegerField(default=1, help_text="Cantidad de unidades/pastillas por blister")
    blisters_por_caja = models.IntegerField(default=1, help_text="Cantidad de blisters por caja")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activo')
    unidad_medida = models.ForeignKey(UnidadMedida, on_delete=models.PROTECT)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')

    class Meta:
        verbose_name_plural = 'Productos'
        verbose_name = 'Producto'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Lote(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='lotes')
    codigo_lote = models.CharField(max_length=100)
    fecha_vencimiento = models.DateField()
    stock_real = models.IntegerField(default=0)
    stock_flotante = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Lotes'
        verbose_name = 'Lote'

    def __str__(self):
        return f"Lote {self.codigo_lote} ({self.producto.nombre})"

class PrediccionML(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='predicciones')
    fecha_prediccion = models.DateField()
    probabilidad_agotamiento = models.DecimalField(max_digits=5, decimal_places=4)
    tendencia_consumo = models.CharField(max_length=50) # 'alta', 'moderada', 'baja'
    version_modelo = models.CharField(max_length=50)

    class Meta:
        verbose_name_plural = 'Predicciones ML'
        verbose_name = 'Predicción ML'

    def __str__(self):
        return f"Predicción {self.id} - {self.producto.nombre}"

class Alerta(models.Model):
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('revisada', 'Revisada'),
        ('descartada', 'Descartada'),
    )
    ORIGEN_CHOICES = (
        ('reglas', 'Reglas'),
        ('ml', 'ML'),
        ('manual', 'Manual'),
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='alertas')
    prediccion = models.ForeignKey(PrediccionML, on_delete=models.SET_NULL, null=True, blank=True)
    alerta = models.CharField(max_length=200)
    nivel_riesgo = models.CharField(max_length=50)
    periodo_agotamiento = models.IntegerField() # en dias
    stock_minimo = models.IntegerField()
    fecha_alerta = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    origen = models.CharField(max_length=20, choices=ORIGEN_CHOICES, default='reglas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Alertas'
        verbose_name = 'Alerta'

    def __str__(self):
        return f"Alerta: {self.alerta} - Riesgo: {self.nivel_riesgo}"

class Recomendacion(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='recomendaciones')
    prediccion = models.ForeignKey(PrediccionML, on_delete=models.SET_NULL, null=True, blank=True)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()

    class Meta:
        verbose_name_plural = 'Recomendaciones'
        verbose_name = 'Recomendación'

    def __str__(self):
        return self.titulo

class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Clientes'
        verbose_name = 'Cliente'

    def __str__(self):
        if self.apellido:
            return f"{self.nombre} {self.apellido}"
        return self.nombre

class Rol(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    permisos = models.ManyToManyField(Permission, blank=True, help_text="Permisos específicos para este rol")

    class Meta:
        verbose_name_plural = 'Roles'
        verbose_name = 'Rol'

    def __str__(self):
        return self.nombre

class Sede(models.Model):
    nombre = models.CharField(max_length=100)
    direccion = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Sedes'
        verbose_name = 'Sede'

    def __str__(self):
        return self.nombre

class Usuario(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='usuario_perfil')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True)
    sede = models.ForeignKey(Sede, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Usuarios'
        verbose_name = 'Usuario'

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

class Venta(models.Model):
    ESTADO_CHOICES = (
        ('Pendiente', 'Pendiente'),
        ('Completado', 'Completado'),
        ('Cancelado', 'Cancelado'),
    )
    codigo = models.CharField(max_length=50, unique=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='ventas_realizadas')
    fecha = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Completado')

    class Meta:
        verbose_name_plural = 'Ventas'
        verbose_name = 'Venta'

    def __str__(self):
        return f"Venta {self.codigo}"

class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)
    cantidad_real = models.IntegerField(default=0)
    cantidad_flotante = models.IntegerField(default=0)
    cantidad_blister = models.IntegerField(default=0)
    precio_real = models.DecimalField(max_digits=10, decimal_places=2)
    precio_flotante = models.DecimalField(max_digits=10, decimal_places=2)
    precio_blister = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name_plural = 'Detalles de Venta'
        verbose_name = 'Detalle de Venta'

    def __str__(self):
        return f"Detalle {self.id} de Venta {self.venta.codigo}"
