# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import (
    Categoria, Presentacion, Producto, Lote, PrediccionML, Alerta, 
    Recomendacion, Cliente, Rol, Sede, Usuario, Venta, DetalleVenta
)

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Sede)
class SedeAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'direccion')
    search_fields = ('nombre',)

@admin.register(Presentacion)
class PresentacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'abreviatura')
    search_fields = ('nombre', 'abreviatura')

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'precio_real', 'estado', 'categoria')
    search_fields = ('codigo', 'nombre')

    @admin.display(description='Estado')
    def estado(self, obj):
        return obj.estado

@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ('codigo_lote', 'producto', 'stock_real', 'stock_flotante', 'fecha_vencimiento', 'estado')
    search_fields = ('codigo_lote', 'producto__nombre')

    @admin.display(description='Estado')
    def estado(self, obj):
        return obj.estado

@admin.register(PrediccionML)
class PrediccionMLAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'probabilidad_agotamiento', 'tendencia_consumo', 'fecha_prediccion')
    list_filter = ('tendencia_consumo',)

@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ('alerta', 'producto', 'nivel_riesgo', 'stock_minimo', 'fecha_alerta')
    list_filter = ('nivel_riesgo',)

@admin.register(Recomendacion)
class RecomendacionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'producto')

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido', 'email')
    search_fields = ('nombre', 'apellido', 'email')

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    filter_horizontal = ('permisos',)

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido', 'email', 'rol', 'sede')

class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    extra = 1

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'cliente', 'usuario', 'total', 'fecha', 'estado')
    list_filter = ('estado', 'fecha')
    inlines = [DetalleVentaInline]
