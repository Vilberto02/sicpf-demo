from datetime import date
from decimal import Decimal
import uuid
from django.db import transaction
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
from .models import (
    Categoria, Presentacion, Marca, Producto, Lote, PrediccionML, Alerta,
    Recomendacion, Cliente, Rol, Usuario, Venta, DetalleVenta, Sede,
    RegistroAuditoria
)
from .permissions import sync_user_groups, is_admin_user
from .services import AlertGenerationService, AuditService

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class PresentacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presentacion
        fields = '__all__'

class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    # Optional: include category name for easier frontend display
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    presentacion_nombre = serializers.ReadOnlyField(source='presentacion.nombre')
    # Estado derivado de los lotes con stock (solo lectura)
    estado = serializers.SerializerMethodField()
    tipo_producto = serializers.ReadOnlyField()
    marcas_disponibles = serializers.ReadOnlyField()
    condicion_venta_display = serializers.CharField(source='get_condicion_venta_display', read_only=True)

    class Meta:
        model = Producto
        fields = '__all__'

    def get_estado(self, obj):
        return obj.estado

class LoteSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    producto_codigo = serializers.ReadOnlyField(source='producto.codigo')
    producto_dci = serializers.ReadOnlyField(source='producto.dci')
    producto_concentracion = serializers.ReadOnlyField(source='producto.concentracion')
    producto_forma_farmaceutica = serializers.ReadOnlyField(source='producto.forma_farmaceutica')
    producto_registro_sanitario = serializers.ReadOnlyField(source='producto.registro_sanitario')
    producto_condicion_venta = serializers.ReadOnlyField(source='producto.condicion_venta')
    producto_condicion_venta_display = serializers.CharField(source='producto.get_condicion_venta_display', read_only=True)
    producto_estado = serializers.SerializerMethodField()
    estado = serializers.SerializerMethodField()
    marca_nombre = serializers.SerializerMethodField()
    tipo_producto_display = serializers.CharField(source='get_tipo_producto_display', read_only=True)
    categoria_nombre = serializers.ReadOnlyField(source='producto.categoria.nombre')
    precio_real = serializers.ReadOnlyField(source='producto.precio_real')
    precio_flotante = serializers.ReadOnlyField(source='producto.precio_flotante')
    precio_blister = serializers.ReadOnlyField(source='producto.precio_blister')
    unidades_por_blister = serializers.ReadOnlyField(source='producto.unidades_por_blister')
    unidades_por_caja = serializers.ReadOnlyField(source='producto.unidades_por_caja')
    blisters_por_caja = serializers.ReadOnlyField(source='producto.blisters_por_caja')
    presentacion_principal = serializers.ReadOnlyField(source='producto.presentacion_principal')
    presentacion_blister = serializers.ReadOnlyField(source='producto.presentacion_blister')
    presentacion_unidad = serializers.ReadOnlyField(source='producto.presentacion_unidad')
    presentacion_nombre = serializers.ReadOnlyField(source='producto.presentacion.nombre')
    presentacion_abrev = serializers.ReadOnlyField(source='producto.presentacion.abreviatura')

    class Meta:
        model = Lote
        fields = '__all__'

    def get_marca_nombre(self, obj):
        return obj.marca.nombre if obj.marca_id else None

    def get_estado(self, obj):
        return obj.estado

    def get_producto_estado(self, obj):
        return obj.producto.estado

class LoteDetalleSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    codigo_lote = serializers.CharField()
    fecha_vencimiento = serializers.DateField()
    dias_restantes = serializers.IntegerField()
    vencido = serializers.BooleanField()
    stock_real = serializers.IntegerField()
    stock_flotante = serializers.IntegerField()
    tipo_producto = serializers.CharField(required=False)
    marca_nombre = serializers.CharField(allow_null=True, required=False)

class PrediccionMLSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrediccionML
        fields = '__all__'

class AlertaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    producto_codigo = serializers.ReadOnlyField(source='producto.codigo')
    categoria_nombre = serializers.ReadOnlyField(source='producto.categoria.nombre')
    tendencia_consumo = serializers.SerializerMethodField()
    stock_actual_real = serializers.SerializerMethodField()
    stock_actual_flotante = serializers.SerializerMethodField()
    producto_stock_minimo_real = serializers.ReadOnlyField(source='producto.stock_minimo_real')
    producto_stock_minimo_flotante = serializers.ReadOnlyField(source='producto.stock_minimo_flotante')
    total_unidades = serializers.SerializerMethodField()
    ventas_promedio_diario_30d = serializers.SerializerMethodField()
    dias_cobertura = serializers.SerializerMethodField()
    explicacion = serializers.SerializerMethodField()
    lotes_afectados = serializers.SerializerMethodField()

    class Meta:
        model = Alerta
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._ctx_cache = {}

    def get_tendencia_consumo(self, obj):
        if obj.prediccion:
            return obj.prediccion.tendencia_consumo
        return None

    def _contexto_producto(self, obj):
        obj_id = obj.id
        if obj_id in self._ctx_cache:
            return self._ctx_cache[obj_id]

        lotes = list(obj.producto.lotes.all())
        stock_real = sum(l.stock_real for l in lotes)
        stock_flotante = sum(l.stock_flotante for l in lotes)
        ctx = {
            'lotes': lotes,
            'stock_real': stock_real,
            'stock_flotante': stock_flotante,
            'total_unidades': AlertGenerationService._total_unidades(
                stock_real, stock_flotante, obj.producto
            ),
            'ventas_promedio': AlertGenerationService._get_ventas_promedio(
                obj.producto, dias=30
            ),
        }
        self._ctx_cache[obj_id] = ctx
        return ctx

    def get_stock_actual_real(self, obj):
        return self._contexto_producto(obj)['stock_real']

    def get_stock_actual_flotante(self, obj):
        return self._contexto_producto(obj)['stock_flotante']

    def get_total_unidades(self, obj):
        return self._contexto_producto(obj)['total_unidades']

    def get_ventas_promedio_diario_30d(self, obj):
        return round(self._contexto_producto(obj)['ventas_promedio'], 2)

    def get_dias_cobertura(self, obj):
        ctx = self._contexto_producto(obj)
        return AlertGenerationService._calcular_dias_cobertura(
            ctx['stock_real'], ctx['stock_flotante'], obj.producto
        )

    def get_explicacion(self, obj):
        ctx = self._contexto_producto(obj)
        unidades = int(ctx['total_unidades'])
        consumo = round(ctx['ventas_promedio'], 2)

        if obj.tipo in ('stock_critico', 'stock_bajo'):
            stock_real = ctx['stock_real']
            stock_flotante = ctx['stock_flotante']
            minimo_real = obj.stock_minimo
            minimo_flotante = obj.stock_minimo_flotante

            incumplidas = []
            if minimo_real is not None and stock_real <= minimo_real:
                incumplidas.append(
                    f"el stock real ({stock_real} cajas) esta por debajo o igual al "
                    f"minimo de cajas definido ({minimo_real} cajas)"
                )
            if minimo_flotante is not None and stock_flotante <= minimo_flotante:
                incumplidas.append(
                    f"el stock flotante ({stock_flotante} unidades sueltas) esta por debajo "
                    f"o igual al minimo de unidades sueltas definido ({minimo_flotante} unidades)"
                )

            detalle_incumplimiento = (
                "Se genera la alerta porque " + " y tambien porque ".join(incumplidas)
                if incumplidas
                else (
                    f"Se genera la alerta porque el stock real ({stock_real} cajas) o el "
                    f"stock flotante ({stock_flotante} unidades sueltas) se aproxima a los "
                    f"minimos definidos ({minimo_real} cajas / {minimo_flotante} unidades, "
                    f"umbral de alerta temprana: 150% del minimo)"
                )
            )

            prefijo = (
                "El stock disponible es igual o menor al minimo definido."
                if obj.tipo == 'stock_critico'
                else "El stock disponible esta por debajo del 150% del minimo definido."
            )
            return (
                f"{prefijo} {detalle_incumplimiento}. Los minimos se evaluan de forma "
                f"independiente para cada presentacion: cajas cerradas (stock real) y "
                f"unidades sueltas (stock flotante). Con un consumo promedio de {consumo} "
                f"unidades/dia (ultimos 30 dias), la cobertura actual es de aproximadamente "
                f"{obj.periodo_agotamiento} dias."
            )
        elif obj.tipo == 'vencimiento':
            hoy = date.today()
            lotes_proximos = [
                l for l in ctx['lotes']
                if (l.fecha_vencimiento - hoy).days <= 15
            ]
            detalle_lotes = ", ".join(
                f"{l.codigo_lote} (vence {l.fecha_vencimiento.strftime('%d/%m/%Y')})"
                for l in lotes_proximos
            ) or "lote no especificado"
            return (
                f"Hay lotes con vencimiento proximo o vencido: {detalle_lotes}. "
                f"Este stock no debe venderse despues de su fecha de vencimiento, por lo que "
                f"se recomienda priorizar su rotacion (FEFO) o retirarlo del inventario."
            )
        elif obj.tipo == 'quiebre':
            return (
                f"Con base en las ventas registradas en los ultimos 30 dias "
                f"({consumo} unidades/dia) y el stock actual de {unidades} unidades "
                f"({ctx['stock_real']} caja(s) + {ctx['stock_flotante']} unidades sueltas), "
                f"se estima que el producto se agotara en aproximadamente "
                f"{obj.periodo_agotamiento} dias."
            )
        else:
            return obj.alerta

    def get_lotes_afectados(self, obj):
        hoy = date.today()
        lotes = []
        for lote in obj.producto.lotes.all().order_by('fecha_vencimiento'):
            dias = (lote.fecha_vencimiento - hoy).days
            lotes.append({
                'id': lote.id,
                'codigo_lote': lote.codigo_lote,
                'fecha_vencimiento': lote.fecha_vencimiento,
                'dias_restantes': dias,
                'vencido': dias < 0,
                'stock_real': lote.stock_real,
                'stock_flotante': lote.stock_flotante,
            })
        return LoteDetalleSerializer(lotes, many=True).data

class RecomendacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recomendacion
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class SedeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = '__all__'

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    # La fuente de verdad para estos campos es el User de Django; el acceso
    # se mantiene bajo los mismos nombres para no romper el contrato del frontend.
    nombre = serializers.CharField(required=False, source='user.first_name')
    apellido = serializers.CharField(required=False, allow_blank=True, source='user.last_name')
    email = serializers.EmailField(required=False, source='user.email')
    rol_nombre = serializers.ReadOnlyField(source='rol.nombre')
    user_username = serializers.ReadOnlyField(source='user.username')
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = '__all__'

    def get_is_active(self, obj):
        return obj.user.is_active if obj.user_id else True

    def validate_username(self, value):
        qs = User.objects.filter(username=value)
        if self.instance and self.instance.user_id:
            qs = qs.exclude(pk=self.instance.user.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya existe un usuario con ese nombre de usuario.")
        return value

    def validate_email(self, value):
        qs = Usuario.objects.filter(user__email__iexact=value)
        if self.instance and self.instance.user_id:
            qs = qs.exclude(user=self.instance.user)
        if qs.exists():
            raise serializers.ValidationError("Ya existe un usuario con ese email.")
        return value

    def _validar_password(self, password):
        try:
            # pyrefly: ignore [missing-import]
            from django.contrib.auth.password_validation import validate_password
        except ImportError:
            return password
        user_for_validation = self.instance.user if self.instance and self.instance.user_id else None
        validate_password(password, user=user_for_validation)
        return password

    def validate_password(self, value):
        return self._validar_password(value)

    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        if not username or not password:
            raise serializers.ValidationError(
                {"username": "username y password son obligatorios para crear un usuario."}
            )

        # Extraer los datos mapeados a 'user'
        user_data = validated_data.pop('user', {})
        email = user_data.get('email', '')
        first_name = user_data.get('first_name', '')
        last_name = user_data.get('last_name', '')

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        instance = Usuario.objects.create(user=user, **validated_data)
        sync_user_groups(user, instance.rol)
        return instance

    def update(self, instance, validated_data):
        rol_anterior = instance.rol_id
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        
        # Extraer los datos del dict anidado 'user'
        user_data = validated_data.pop('user', {})
        first_name = user_data.get('first_name')
        last_name = user_data.get('last_name')
        email = user_data.get('email')

        user = instance.user
        if user:
            if username:
                user.username = username
            if password:
                user.set_password(password)
            if first_name is not None:
                user.first_name = first_name
            if last_name is not None:
                user.last_name = last_name
            if email is not None:
                user.email = email
            if any(v is not None for v in (username, password, first_name, last_name, email)):
                user.save()

        instance = super().update(instance, validated_data)

        if instance.rol_id != rol_anterior or 'rol' in validated_data:
            sync_user_groups(instance.user, instance.rol)

        return instance

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    lote_codigo = serializers.ReadOnlyField(source='lote.codigo_lote')
    lote_fecha_vencimiento = serializers.ReadOnlyField(source='lote.fecha_vencimiento')
    presentacion_abrev = serializers.ReadOnlyField(source='producto.presentacion.abreviatura')
    
    class Meta:
        model = DetalleVenta
        fields = '__all__'

class DetalleVentaCreateSerializer(serializers.ModelSerializer):
    precio_real = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    precio_flotante = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    precio_blister = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = DetalleVenta
        fields = ['producto', 'lote', 'cantidad_real', 'cantidad_flotante', 'cantidad_blister', 'precio_real', 'precio_flotante', 'precio_blister']

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    detalles_write = DetalleVentaCreateSerializer(many=True, write_only=True, required=False)
    cliente_nombre = serializers.ReadOnlyField(source='cliente.nombre')
    cliente_dni = serializers.ReadOnlyField(source='cliente.dni')
    vendedor_nombre = serializers.ReadOnlyField(source='usuario.nombre')
    tipo_comprobante_display = serializers.CharField(source='get_tipo_comprobante_display', read_only=True)
    op_gravada = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    igv = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    codigo = serializers.CharField(required=False)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Venta
        fields = '__all__'

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles_write', [])
        if not detalles_data:
            raise serializers.ValidationError({"detalles": "Debe incluir al menos un producto en la venta."})
        
        # Blindaje: Vincular usuario autenticado automáticamente (evita suplantación)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            perfil = getattr(request.user, 'usuario_perfil', None) or getattr(request.user, 'usuario', None)
            if not perfil:
                perfil, _ = Usuario.objects.get_or_create(user=request.user)
            validated_data['usuario'] = perfil

        # Generación de código seguro en el servidor si no viene o para evitar colisiones
        codigo_enviado = validated_data.get('codigo')
        if not codigo_enviado or Venta.objects.filter(codigo=codigo_enviado).exists():
            hoy_str = date.today().strftime('%Y%m%d')
            secuencia = uuid.uuid4().hex[:6].upper()
            validated_data['codigo'] = f"VNT-{hoy_str}-{secuencia}"

        # Bloqueo pesimista con select_for_update para evitar condiciones de carrera (Race Conditions)
        lote_ids = [d.get('lote').id for d in detalles_data if d.get('lote')]
        lotes_db = {
            l.id: l for l in Lote.objects.select_for_update().select_related('producto').filter(id__in=lote_ids)
        }

        total_calculado = Decimal('0.00')
        detalles_preparados = []
        lotes_temp = {}

        for detalle_data in detalles_data:
            lote_input = detalle_data.get('lote')
            if not lote_input or lote_input.id not in lotes_db:
                raise serializers.ValidationError("Lote no válido o inexistente.")
            
            lote = lotes_db[lote_input.id]
            if lote.estado == 'vencido':
                raise serializers.ValidationError(
                    f"No se puede vender el lote vencido: {lote.codigo_lote}"
                )

            if lote.id not in lotes_temp:
                lotes_temp[lote.id] = {
                    'stock_real': lote.stock_real,
                    'stock_flotante': lote.stock_flotante,
                    'obj': lote
                }

            req_real = int(detalle_data.get('cantidad_real', 0) or 0)
            req_flot = int(detalle_data.get('cantidad_flotante', 0) or 0)
            blisters = int(detalle_data.get('cantidad_blister', 0) or 0)
            
            if blisters > 0:
                req_flot += blisters * lote.producto.unidades_por_blister

            temp = lotes_temp[lote.id]

            # Conversión automática cajas -> flotante
            unidades_en_principal = max(
                lote.producto.unidades_por_caja,
                lote.producto.blisters_por_caja * lote.producto.unidades_por_blister
            )

            while temp['stock_flotante'] < req_flot and temp['stock_real'] > req_real:
                temp['stock_real'] -= 1
                temp['stock_flotante'] += unidades_en_principal

            if temp['stock_real'] < req_real or temp['stock_flotante'] < req_flot:
                raise serializers.ValidationError(f"Stock insuficiente para el lote: {lote.codigo_lote}")

            temp['stock_real'] -= req_real
            temp['stock_flotante'] -= req_flot

            # PRECIOS OFICIALES DEL SERVIDOR (Blindaje contra adulteración de precios en el cliente)
            precio_real_oficial = Decimal(str(lote.producto.precio_real))
            precio_flot_oficial = Decimal(str(lote.producto.precio_flotante))
            precio_blister_oficial = Decimal(str(lote.producto.precio_blister))

            subtotal_linea = (
                Decimal(str(req_real)) * precio_real_oficial +
                Decimal(str(int(detalle_data.get('cantidad_flotante', 0) or 0))) * precio_flot_oficial +
                Decimal(str(blisters)) * precio_blister_oficial
            )
            total_calculado += subtotal_linea

            detalles_preparados.append({
                'producto': lote.producto,
                'lote': lote,
                'cantidad_real': req_real,
                'cantidad_flotante': int(detalle_data.get('cantidad_flotante', 0) or 0),
                'cantidad_blister': blisters,
                'precio_real': precio_real_oficial,
                'precio_flotante': precio_flot_oficial,
                'precio_blister': precio_blister_oficial,
            })

        # Asignar total recalculado por el servidor
        validated_data['total'] = round(total_calculado, 2)

        # Validación SUNAT: Para ventas mayores a S/ 700.00 es obligatorio consignar DNI (8 dígitos)
        if total_calculado > Decimal('700.00'):
            cliente = validated_data.get('cliente')
            dni = getattr(cliente, 'dni', None) if cliente else None
            dni_str = str(dni).strip() if dni else ""
            if not dni_str or len(dni_str) != 8 or not dni_str.isdigit():
                raise serializers.ValidationError({
                    "cliente": "Por normativa SUNAT, para ventas mayores a S/ 700.00 es obligatorio que el cliente cuente con un DNI válido de 8 dígitos."
                })

        venta = Venta.objects.create(**validated_data)

        for dp in detalles_preparados:
            DetalleVenta.objects.create(venta=venta, **dp)

        # Actualizar stock en base de datos
        for temp in lotes_temp.values():
            l = temp['obj']
            l.stock_real = temp['stock_real']
            l.stock_flotante = temp['stock_flotante']
            l.save(update_fields=['stock_real', 'stock_flotante', 'updated_at'])

        # Registro de Auditoría
        AuditService.registrar(
            accion='CREACION',
            tabla_afectada='Venta',
            registro_id=venta.id,
            detalles={
                'codigo': venta.codigo,
                'total': str(venta.total),
                'cliente_id': venta.cliente_id,
                'items_count': len(detalles_preparados)
            },
            request=request
        )

        return venta

    @transaction.atomic
    def update(self, instance, validated_data):
        estado_nuevo = validated_data.get('estado', instance.estado)
        request = self.context.get('request')

        # Si intenta anular la venta: verificar autorización de Administrador
        if instance.estado != 'Cancelado' and estado_nuevo == 'Cancelado':
            user = request.user if request else None
            if not is_admin_user(user):
                raise serializers.ValidationError(
                    {"estado": "Toda anulación de venta requiere la autorización explícita de un Administrador."}
                )

            # Bloquear lotes y reponer stock de forma atómica
            lote_ids = [d.lote_id for d in instance.detalles.all()]
            lotes_db = {
                l.id: l for l in Lote.objects.select_for_update().select_related('producto').filter(id__in=lote_ids)
            }

            for detalle in instance.detalles.all():
                lote = lotes_db.get(detalle.lote_id)
                if lote:
                    lote.stock_real += detalle.cantidad_real
                    lote.stock_flotante += detalle.cantidad_flotante
                    if detalle.cantidad_blister > 0:
                        lote.stock_flotante += detalle.cantidad_blister * lote.producto.unidades_por_blister
                    lote.save(update_fields=['stock_real', 'stock_flotante', 'updated_at'])

            AuditService.registrar(
                accion='ANULACION_VENTA',
                tabla_afectada='Venta',
                registro_id=instance.id,
                detalles={
                    'codigo': instance.codigo,
                    'total': str(instance.total),
                    'motivo': validated_data.get('motivo', 'Anulación autorizada por Administrador')
                },
                request=request
            )

        # Actualizar campos normalmente
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class RegistroAuditoriaSerializer(serializers.ModelSerializer):
    usuario_username = serializers.ReadOnlyField(source='usuario.username')

    class Meta:
        model = RegistroAuditoria
        fields = '__all__'


