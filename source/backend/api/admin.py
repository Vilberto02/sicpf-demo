# pyrefly: ignore [missing-import]
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Categoria, Presentacion, Producto, Lote, PrediccionML, Alerta, 
    Recomendacion, Cliente, Rol, Sede, Usuario, Venta, DetalleVenta,
    RegistroAuditoria
)
from .services import AuditService

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
    list_display = (
        'codigo',
        'nombre',
        'precio_real',
        'categoria',
        'estado_registro',
        'estado_vencimiento',
    )
    search_fields = ('codigo', 'nombre')
    list_filter = ('is_active', 'categoria')
    actions = ['desactivar_productos', 'activar_productos']

    @admin.display(description='Estado (Activo / Desactivado)', boolean=True, ordering='is_active')
    def estado_registro(self, obj):
        return obj.is_active

    @admin.display(description='Estado (Vencimiento)')
    def estado_vencimiento(self, obj):
        colores = {
            'activo': '#16a34a',
            'por vencer': '#d97706',
            'vencido': '#dc2626',
        }
        color = colores.get(obj.estado, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: #ffffff; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px; text-transform: uppercase;">{}</span>',
            color,
            obj.estado
        )

    @admin.action(description='Desactivar productos seleccionados (Soft Delete)')
    def desactivar_productos(self, request, queryset):
        total = 0
        for producto in queryset:
            producto.is_active = False
            producto.save()
            producto.lotes.update(is_active=False)
            AuditService.registrar(
                accion='ELIMINACION',
                tabla_afectada='Producto',
                registro_id=producto.pk,
                detalles={'codigo': producto.codigo, 'nombre': producto.nombre, 'tipo': 'soft_delete_admin'},
                request=request
            )
            total += 1
        self.message_user(request, f"{total} producto(s) desactivado(s) exitosamente junto a sus lotes.")

    @admin.action(description='Activar / Restaurar productos seleccionados')
    def activar_productos(self, request, queryset):
        total = 0
        for producto in queryset:
            producto.is_active = True
            producto.save()
            producto.lotes.update(is_active=True)
            AuditService.registrar(
                accion='MODIFICACION',
                tabla_afectada='Producto',
                registro_id=producto.pk,
                detalles={'codigo': producto.codigo, 'nombre': producto.nombre, 'tipo': 'reactivar_admin'},
                request=request
            )
            total += 1
        self.message_user(request, f"{total} producto(s) reactivado(s) exitosamente junto a sus lotes.")

@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = (
        'codigo_lote',
        'producto',
        'stock_real',
        'stock_flotante',
        'fecha_vencimiento',
        'estado_registro',
        'estado_vencimiento',
    )
    search_fields = ('codigo_lote', 'producto__nombre')
    list_filter = ('is_active', 'fecha_vencimiento')
    actions = ['desactivar_lotes', 'activar_lotes']

    @admin.display(description='Estado (Activo / Desactivado)', boolean=True, ordering='is_active')
    def estado_registro(self, obj):
        return obj.is_active

    @admin.display(description='Estado (Vencimiento)')
    def estado_vencimiento(self, obj):
        colores = {
            'activo': '#16a34a',
            'por vencer': '#d97706',
            'vencido': '#dc2626',
        }
        color = colores.get(obj.estado, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: #ffffff; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px; text-transform: uppercase;">{}</span>',
            color,
            obj.estado
        )

    @admin.action(description='Desactivar lotes seleccionados (Soft Delete)')
    def desactivar_lotes(self, request, queryset):
        total = 0
        for lote in queryset:
            lote.is_active = False
            lote.save()
            AuditService.registrar(
                accion='ELIMINACION',
                tabla_afectada='Lote',
                registro_id=lote.pk,
                detalles={'codigo_lote': lote.codigo_lote, 'producto': lote.producto.nombre, 'tipo': 'soft_delete_admin'},
                request=request
            )
            total += 1
        self.message_user(request, f"{total} lote(s) desactivado(s) exitosamente.")

    @admin.action(description='Activar / Restaurar lotes seleccionados')
    def activar_lotes(self, request, queryset):
        total = 0
        for lote in queryset:
            lote.is_active = True
            lote.save()
            AuditService.registrar(
                accion='MODIFICACION',
                tabla_afectada='Lote',
                registro_id=lote.pk,
                detalles={'codigo_lote': lote.codigo_lote, 'producto': lote.producto.nombre, 'tipo': 'reactivar_admin'},
                request=request
            )
            total += 1
        self.message_user(request, f"{total} lote(s) reactivado(s) exitosamente.")

@admin.register(PrediccionML)
class PrediccionMLAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'probabilidad_agotamiento', 'tendencia_consumo', 'fecha_prediccion')
    list_filter = ('tendencia_consumo',)

@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ('alerta', 'producto', 'nivel_riesgo', 'tipo', 'stock_minimo',
                    'stock_minimo_flotante', 'fecha_alerta')
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
    list_display = ('nombre', 'apellido', 'username_display', 'email', 'rol', 'sede')
    search_fields = ('user__first_name', 'user__last_name', 'user__username', 'user__email')

    @admin.display(description='Usuario')
    def username_display(self, obj):
        return obj.user.username if obj.user_id else '-'

class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    extra = 1

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'cliente', 'usuario', 'total', 'fecha', 'estado')
    list_filter = ('estado', 'fecha')
    inlines = [DetalleVentaInline]

@admin.register(RegistroAuditoria)
class RegistroAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'accion', 'usuario', 'tabla_afectada', 'registro_id', 'ip_origen')
    list_filter = ('accion', 'fecha', 'tabla_afectada')
    search_fields = ('usuario__username', 'tabla_afectada', 'registro_id', 'detalles')
    readonly_fields = ('fecha', 'usuario', 'accion', 'tabla_afectada', 'registro_id', 'detalles', 'ip_origen', 'user_agent')

