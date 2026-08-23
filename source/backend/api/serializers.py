from datetime import date

from rest_framework import serializers
from .models import (
    Categoria, Producto, Lote, PrediccionML, Alerta,
    Recomendacion, Cliente, Rol, Usuario, Venta, DetalleVenta
)
from .services import AlertGenerationService

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    # Optional: include category name for easier frontend display
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    
    class Meta:
        model = Producto
        fields = '__all__'

class LoteSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    producto_codigo = serializers.ReadOnlyField(source='producto.codigo')
    producto_estado = serializers.ReadOnlyField(source='producto.estado')
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
    unidad_medida_nombre = serializers.ReadOnlyField(source='producto.unidad_medida.nombre')
    unidad_medida_abrev = serializers.ReadOnlyField(source='producto.unidad_medida.abreviatura')
    
    class Meta:
        model = Lote
        fields = '__all__'

class LoteDetalleSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    codigo_lote = serializers.CharField()
    fecha_vencimiento = serializers.DateField()
    dias_restantes = serializers.IntegerField()
    vencido = serializers.BooleanField()
    stock_real = serializers.IntegerField()
    stock_flotante = serializers.IntegerField()

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

    def get_tendencia_consumo(self, obj):
        if obj.prediccion:
            return obj.prediccion.tendencia_consumo
        return None

    def _contexto_producto(self, obj):
        lotes = list(obj.producto.lotes.all())
        stock_real = sum(l.stock_real for l in lotes)
        stock_flotante = sum(l.stock_flotante for l in lotes)
        return {
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

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.ReadOnlyField(source='rol.nombre')
    
    class Meta:
        model = Usuario
        fields = '__all__'

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    lote_codigo = serializers.ReadOnlyField(source='lote.codigo_lote')
    unidad_medida_abrev = serializers.ReadOnlyField(source='producto.unidad_medida.abreviatura')
    
    class Meta:
        model = DetalleVenta
        fields = '__all__'

class DetalleVentaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleVenta
        fields = ['producto', 'lote', 'cantidad_real', 'cantidad_flotante', 'cantidad_blister', 'precio_real', 'precio_flotante', 'precio_blister']

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    detalles_write = DetalleVentaCreateSerializer(many=True, write_only=True, required=False)
    cliente_nombre = serializers.ReadOnlyField(source='cliente.nombre')
    vendedor_nombre = serializers.ReadOnlyField(source='usuario.nombre')
    
    class Meta:
        model = Venta
        fields = '__all__'

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles_write', [])
        
        # Validar stock y convertir si es necesario (en memoria)
        # Hacemos una copia profunda de los stocks para no alterar la BD si la validación falla
        lotes_temp = {}
        for detalle_data in detalles_data:
            lote = detalle_data.get('lote')
            if lote:
                if lote.id not in lotes_temp:
                    lotes_temp[lote.id] = {'stock_real': lote.stock_real, 'stock_flotante': lote.stock_flotante, 'obj': lote}
                
                req_real = detalle_data.get('cantidad_real', 0)
                req_flot = detalle_data.get('cantidad_flotante', 0)
                blisters = detalle_data.get('cantidad_blister', 0)
                if blisters > 0:
                    req_flot += blisters * lote.producto.unidades_por_blister
                
                temp = lotes_temp[lote.id]
                
                # Conversión automática
                unidades_en_principal = max(lote.producto.unidades_por_caja, lote.producto.blisters_por_caja * lote.producto.unidades_por_blister)
                
                while temp['stock_flotante'] < req_flot and temp['stock_real'] > req_real:
                    temp['stock_real'] -= 1
                    temp['stock_flotante'] += unidades_en_principal
                
                if temp['stock_real'] < req_real or temp['stock_flotante'] < req_flot:
                    raise serializers.ValidationError(f"Stock insuficiente para el lote: {lote.codigo_lote}")
                    
                temp['stock_real'] -= req_real
                temp['stock_flotante'] -= req_flot

        venta = Venta.objects.create(**validated_data)
        for detalle_data in detalles_data:
            DetalleVenta.objects.create(venta=venta, **detalle_data)
            
        # Guardar los stocks actualizados (incluyendo las conversiones)
        for temp in lotes_temp.values():
            lote = temp['obj']
            lote.stock_real = temp['stock_real']
            lote.stock_flotante = temp['stock_flotante']
            lote.save()
                
        return venta

    def update(self, instance, validated_data):
        estado_nuevo = validated_data.get('estado', instance.estado)
        
        # Si transiciona a "Cancelado" por primera vez
        if instance.estado != 'Cancelado' and estado_nuevo == 'Cancelado':
            for detalle in instance.detalles.all():
                lote = detalle.lote
                if lote:
                    lote.stock_real += detalle.cantidad_real
                    lote.stock_flotante += detalle.cantidad_flotante
                    if detalle.cantidad_blister > 0:
                        lote.stock_flotante += detalle.cantidad_blister * lote.producto.unidades_por_blister
                    lote.save()
                
        # Actualizar campos normalmente
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

