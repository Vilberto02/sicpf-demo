from rest_framework import serializers
from .models import (
    Categoria, Producto, Lote, PrediccionML, Alerta, 
    Recomendacion, Cliente, Rol, Usuario, Venta, DetalleVenta
)

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
    
    class Meta:
        model = Lote
        fields = '__all__'

class PrediccionMLSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrediccionML
        fields = '__all__'

class AlertaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    tendencia_consumo = serializers.ReadOnlyField(source='prediccion.tendencia_consumo')
    categoria_nombre = serializers.ReadOnlyField(source='producto.categoria.nombre')
    
    class Meta:
        model = Alerta
        fields = '__all__'

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
        venta = Venta.objects.create(**validated_data)
        for detalle_data in detalles_data:
            DetalleVenta.objects.create(venta=venta, **detalle_data)
            
            lote = detalle_data.get('lote')
            if lote:
                lote.stock_real -= detalle_data.get('cantidad_real', 0)
                lote.stock_flotante -= detalle_data.get('cantidad_flotante', 0)
                blisters = detalle_data.get('cantidad_blister', 0)
                if blisters > 0:
                    lote.stock_flotante -= blisters * lote.producto.unidades_por_blister
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
