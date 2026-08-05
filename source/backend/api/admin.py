# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import InventoryItem, Sale, Alert, Recommendation

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'stock_flotante', 'stock_real', 'vencimiento', 'status', 'categoria')
    search_fields = ('codigo', 'nombre', 'lote', 'categoria')
    list_filter = ('status', 'categoria')

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'cliente', 'monto', 'fecha', 'status', 'vendedor')
    search_fields = ('codigo', 'cliente', 'vendedor')
    list_filter = ('status', 'fecha')

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('producto', 'categoria', 'stock_actual', 'stock_minimo', 'tendencia_consumo', 'status')
    search_fields = ('producto', 'categoria')
    list_filter = ('status', 'tendencia_consumo')

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('title',)
    search_fields = ('title', 'description')
