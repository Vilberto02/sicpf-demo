# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from datetime import date
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User, Permission
# pyrefly: ignore [missing-import]
from django.utils import timezone

# pyrefly: ignore [missing-import]
from django.utils import timezone

DIAS_HORIZONTE_VENCIMIENTO = 15

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'Categorías'
        verbose_name = 'Categoría'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Presentacion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    abreviatura = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Presentaciones'
        verbose_name = 'Presentación'

    def __str__(self):
        return self.nombre

class Marca(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Marcas'
        verbose_name = 'Marca'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    precio_real = models.DecimalField(max_digits=10, decimal_places=2, help_text="Precio de la caja")
    precio_flotante = models.DecimalField(max_digits=10, decimal_places=2, help_text="Precio de 1 unidad minima (ej. pastilla)")
    precio_blister = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Precio de 1 blister")
    unidades_por_caja = models.IntegerField(default=1)
    unidades_por_blister = models.IntegerField(default=1, help_text="Cantidad de unidades/pastillas por blister")
    blisters_por_caja = models.IntegerField(default=1, help_text="Cantidad de blisters por caja")

    CONDICION_VENTA_CHOICES = (
        ('libre', 'Venta Libre'),
        ('receta', 'Bajo Receta Médica'),
        ('receta_retenida', 'Receta Retenida / Controlado'),
    )

    # Campos normativos y sanitarios (DIGEMID / MINSA)
    dci = models.CharField(max_length=200, blank=True, null=True, help_text="Denominación Común Internacional / Principio Activo")
    concentracion = models.CharField(max_length=100, blank=True, null=True, help_text="Concentración (ej. 500 mg, 1 g/5 ml)")
    forma_farmaceutica = models.CharField(max_length=100, blank=True, null=True, help_text="Forma Farmacéutica (Tableta, Jarabe, etc.)")
    registro_sanitario = models.CharField(max_length=50, blank=True, null=True, help_text="Registro Sanitario DIGEMID (ej. EE-12345, EN-67890)")
    condicion_venta = models.CharField(max_length=30, choices=CONDICION_VENTA_CHOICES, default='libre', help_text="Condición de venta del producto")

    # Nuevos campos de presentacion
    presentacion_principal = models.BooleanField(default=True, help_text="Se vende por su presentación principal (Caja, Frasco, Tubo, etc.)")
    presentacion_blister = models.BooleanField(default=True, help_text="Se vende por blister")
    presentacion_unidad = models.BooleanField(default=True, help_text="Se vende por unidad mínima (pastilla, ml)")

    presentacion = models.ForeignKey(Presentacion, on_delete=models.PROTECT)
    stock_minimo_real = models.IntegerField(default=10, help_text="Stock minimo en cajas cerradas")
    stock_minimo_flotante = models.IntegerField(default=20, help_text="Stock minimo en unidades sueltas")
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    is_active = models.BooleanField(default=True, help_text="Indica si el producto está activo (Soft Delete)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Productos'
        verbose_name = 'Producto'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at'], name='idx_producto_created_at'),
            models.Index(fields=['categoria'], name='idx_producto_categoria'),
        ]

    def save(self, *args, **kwargs):
        from decimal import Decimal
        if self.presentacion_blister and self.precio_blister == 0 and self.precio_flotante and self.unidades_por_blister:
            precio_calculado = float(self.precio_flotante) * self.unidades_por_blister
            self.precio_blister = round(Decimal(precio_calculado), 2)
        super().save(*args, **kwargs)

    @property
    def estado(self):
        estados_lotes_con_stock = [
            lote.estado for lote in self.lotes.all()
            if lote.stock_real > 0 or lote.stock_flotante > 0
        ]
        if not estados_lotes_con_stock:
            return "activo"
        if all(estado == "vencido" for estado in estados_lotes_con_stock):
            return "vencido"
        if any(estado == "por vencer" for estado in estados_lotes_con_stock):
            return "por vencer"
        return "activo"

    @property
    def tipo_producto(self):
        tipos = set(
            lote.tipo_producto for lote in self.lotes.filter(is_active=True)
            if lote.stock_real > 0 or lote.stock_flotante > 0
        )
        if not tipos:
            tipos = set(lote.tipo_producto for lote in self.lotes.filter(is_active=True))
        if not tipos:
            return "sin lotes"
        if len(tipos) > 1:
            return "mixto"
        return tipos.pop()

    @property
    def marcas_disponibles(self):
        return list(set(
            lote.marca.nombre for lote in self.lotes.filter(is_active=True) if lote.marca_id
        ))

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Lote(models.Model):
    TIPO_PRODUCTO_CHOICES = (
        ('marca', 'De Marca'),
        ('generico', 'Genérico'),
    )

    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='lotes')
    codigo_lote = models.CharField(max_length=100)
    fecha_vencimiento = models.DateField()
    stock_real = models.IntegerField(default=0)
    stock_flotante = models.IntegerField(default=0)
    tipo_producto = models.CharField(
        max_length=20,
        choices=TIPO_PRODUCTO_CHOICES,
        default='generico',
        help_text="Clasificación del lote: de marca o genérico"
    )
    marca = models.ForeignKey(
        Marca,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lotes',
        help_text="Marca comercial o laboratorio asociado al lote"
    )
    is_active = models.BooleanField(default=True, help_text="Indica si el lote está activo (Soft Delete)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def estado(self):
        dias_para_vencer = (self.fecha_vencimiento - date.today()).days
        if dias_para_vencer <= 0:
            return "vencido"
        if dias_para_vencer <= DIAS_HORIZONTE_VENCIMIENTO:
            return "por vencer"
        return "activo"

    class Meta:
        verbose_name_plural = 'Lotes'
        verbose_name = 'Lote'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at'], name='idx_lote_created_at'),
            models.Index(fields=['fecha_vencimiento'], name='idx_lote_fecha_venc'),
            models.Index(fields=['producto'], name='idx_lote_producto'),
            models.Index(fields=['tipo_producto'], name='idx_lote_tipo_prod'),
        ]

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
    TIPO_CHOICES = (
        ('stock_critico', 'Stock crítico'),
        ('stock_bajo', 'Stock bajo'),
        ('vencimiento', 'Vencimiento'),
        ('quiebre', 'Quiebre estimado'),
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='alertas')
    prediccion = models.ForeignKey(PrediccionML, on_delete=models.SET_NULL, null=True, blank=True)
    alerta = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, null=True, blank=True)
    nivel_riesgo = models.CharField(max_length=50)
    periodo_agotamiento = models.IntegerField() # en dias
    stock_minimo = models.IntegerField(help_text="Stock minimo en cajas (stock_real)")
    stock_minimo_flotante = models.IntegerField(null=True, blank=True, help_text="Stock minimo en unidades sueltas (stock_flotante)")
    fecha_alerta = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    origen = models.CharField(max_length=20, choices=ORIGEN_CHOICES, default='reglas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Alertas'
        verbose_name = 'Alerta'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at'], name='idx_alerta_created_at'),
            models.Index(fields=['estado'], name='idx_alerta_estado'),
            models.Index(fields=['fecha_alerta'], name='idx_alerta_fecha'),
            models.Index(fields=['producto'], name='idx_alerta_producto'),
        ]

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
    dni = models.CharField(max_length=8, blank=True, null=True, help_text="DNI del cliente (8 dígitos para ventas > S/ 700)")
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Clientes'
        verbose_name = 'Cliente'
        ordering = ['nombre', 'apellido']

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
    """Perfil del negocio vinculado al User de Django.

    La fuente de verdad para nombre, apellido y email es el User relacionado;
    este modelo solo agrega datos propios del dominio (telefono, direccion,
    rol y sede).
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='usuario_perfil')
    telefono = models.CharField(max_length=50, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True)
    sede = models.ForeignKey(Sede, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Usuarios'
        verbose_name = 'Usuario'
        ordering = ['user__first_name']

    @property
    def nombre(self):
        return self.user.first_name if self.user_id else ""

    @property
    def apellido(self):
        return self.user.last_name if self.user_id else ""

    @property
    def email(self):
        return self.user.email if self.user_id else ""

    def __str__(self):
        return f"{self.nombre} {self.apellido}".strip() or f"Usuario #{self.pk}"

class Venta(models.Model):
    ESTADO_CHOICES = (
        ('Pendiente', 'Pendiente'),
        ('Completado', 'Completado'),
        ('Cancelado', 'Cancelado'),
    )
    TIPO_COMPROBANTE_CHOICES = (
        ('Boleta', 'Boleta de Venta'),
    )
    codigo = models.CharField(max_length=50, unique=True)
    tipo_comprobante = models.CharField(
        max_length=20,
        choices=TIPO_COMPROBANTE_CHOICES,
        default='Boleta',
        help_text="Tipo de comprobante tributario emitido"
    )
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name='ventas_realizadas')
    fecha = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Completado')

    class Meta:
        verbose_name_plural = 'Ventas'
        verbose_name = 'Venta'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha'], name='idx_venta_fecha'),
            models.Index(fields=['estado'], name='idx_venta_estado'),
            models.Index(fields=['cliente'], name='idx_venta_cliente'),
        ]

    @property
    def op_gravada(self):
        from decimal import Decimal, ROUND_HALF_UP
        return (self.total / Decimal('1.18')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def igv(self):
        from decimal import Decimal, ROUND_HALF_UP
        return (self.total - self.op_gravada).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def subtotal(self):
        return self.op_gravada

    def __str__(self):
        return f"Venta {self.codigo}"

class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    lote = models.ForeignKey(Lote, on_delete=models.PROTECT)
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


class RegistroAuditoria(models.Model):
    ACCION_CHOICES = (
        ('LOGIN_EXITOSO', 'Inicio de sesión exitoso'),
        ('LOGIN_FALLIDO', 'Intento de sesión fallido'),
        ('LOGOUT', 'Cierre de sesión'),
        ('CREACION', 'Creación de registro'),
        ('MODIFICACION', 'Modificación de registro'),
        ('ELIMINACION', 'Eliminación/Desactivación'),
        ('ANULACION_VENTA', 'Anulación de venta'),
        ('CAMBIO_PASSWORD', 'Cambio de contraseña'),
        ('ACCESO_DENEGADO', 'Acceso denegado (403)'),
        ('ALERTA_GESTIONADA', 'Gestión de Alerta'),
    )
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='registros_auditoria')
    accion = models.CharField(max_length=50, choices=ACCION_CHOICES)
    tabla_afectada = models.CharField(max_length=100, blank=True, null=True)
    registro_id = models.CharField(max_length=100, blank=True, null=True)
    detalles = models.JSONField(default=dict, blank=True)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Registros de Auditoría'
        verbose_name = 'Registro de Auditoría'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha'], name='idx_audit_fecha'),
            models.Index(fields=['accion'], name='idx_audit_accion'),
            models.Index(fields=['usuario'], name='idx_audit_usuario'),
        ]

    def __str__(self):
        usr = self.usuario.username if self.usuario else "Anónimo/Sistema"
        return f"[{self.fecha.strftime('%Y-%m-%d %H:%M:%S')}] {self.accion} por {usr} en {self.tabla_afectada or 'N/A'}"

