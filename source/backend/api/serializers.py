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
    
    class Meta:
        model = Lote
        fields = '__all__'

class PrediccionMLSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrediccionML
        fields = '__all__'

class AlertaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    
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

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    cliente_nombre = serializers.ReadOnlyField(source='cliente.nombre')
    vendedor_nombre = serializers.ReadOnlyField(source='usuario.nombre')
    
    class Meta:
        model = Venta
        fields = '__all__'
