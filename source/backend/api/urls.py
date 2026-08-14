# pyrefly: ignore [missing-import]
from django.urls import path
from . import views

urlpatterns = [
    # Categoria
    path('categorias/', views.CategoriaListView.as_view(), name='categoria-list'),
    path('categorias/create/', views.CategoriaCreateView.as_view(), name='categoria-create'),
    path('categorias/<int:pk>/', views.CategoriaDetailView.as_view(), name='categoria-detail'),
    path('categorias/<int:pk>/update/', views.CategoriaUpdateView.as_view(), name='categoria-update'),
    path('categorias/<int:pk>/delete/', views.CategoriaDeleteView.as_view(), name='categoria-delete'),

    # Producto
    path('productos/', views.ProductoListView.as_view(), name='producto-list'),
    path('productos/create/', views.ProductoCreateView.as_view(), name='producto-create'),
    path('productos/<int:pk>/', views.ProductoDetailView.as_view(), name='producto-detail'),
    path('productos/<int:pk>/update/', views.ProductoUpdateView.as_view(), name='producto-update'),
    path('productos/<int:pk>/delete/', views.ProductoDeleteView.as_view(), name='producto-delete'),

    # Lote
    path('lotes/', views.LoteListView.as_view(), name='lote-list'),
    path('lotes/create/', views.LoteCreateView.as_view(), name='lote-create'),
    path('lotes/<int:pk>/', views.LoteDetailView.as_view(), name='lote-detail'),
    path('lotes/<int:pk>/update/', views.LoteUpdateView.as_view(), name='lote-update'),
    path('lotes/<int:pk>/delete/', views.LoteDeleteView.as_view(), name='lote-delete'),

    # Cliente
    path('clientes/', views.ClienteListView.as_view(), name='cliente-list'),
    path('clientes/create/', views.ClienteCreateView.as_view(), name='cliente-create'),
    path('clientes/<int:pk>/', views.ClienteDetailView.as_view(), name='cliente-detail'),
    path('clientes/<int:pk>/update/', views.ClienteUpdateView.as_view(), name='cliente-update'),
    path('clientes/<int:pk>/delete/', views.ClienteDeleteView.as_view(), name='cliente-delete'),

    # Usuario
    path('usuarios/', views.UsuarioListView.as_view(), name='usuario-list'),
    path('usuarios/create/', views.UsuarioCreateView.as_view(), name='usuario-create'),
    path('usuarios/<int:pk>/', views.UsuarioDetailView.as_view(), name='usuario-detail'),
    path('usuarios/<int:pk>/update/', views.UsuarioUpdateView.as_view(), name='usuario-update'),
    path('usuarios/<int:pk>/delete/', views.UsuarioDeleteView.as_view(), name='usuario-delete'),

    # Venta
    path('ventas/', views.VentaListView.as_view(), name='venta-list'),
    path('ventas/create/', views.VentaCreateView.as_view(), name='venta-create'),
    path('ventas/<int:pk>/', views.VentaDetailView.as_view(), name='venta-detail'),
    path('ventas/<int:pk>/update/', views.VentaUpdateView.as_view(), name='venta-update'),
    path('ventas/<int:pk>/delete/', views.VentaDeleteView.as_view(), name='venta-delete'),

    # Alertas
    path('alertas/', views.AlertListView.as_view(), name='alerta-list'),
    path('alertas/create/', views.AlertCreateView.as_view(), name='alerta-create'),
    path('alertas/<int:pk>/', views.AlertDetailView.as_view(), name='alerta-detail'),
    path('alertas/<int:pk>/update/', views.AlertUpdateView.as_view(), name='alerta-update'),
    path('alertas/<int:pk>/delete/', views.AlertDeleteView.as_view(), name='alerta-delete'),

    # Recomendaciones
    path('recomendaciones/', views.RecommendationListView.as_view(), name='recomendacion-list'),
    path('recomendaciones/create/', views.RecommendationCreateView.as_view(), name='recomendacion-create'),
    path('recomendaciones/<int:pk>/', views.RecommendationDetailView.as_view(), name='recomendacion-detail'),
    path('recomendaciones/<int:pk>/update/', views.RecommendationUpdateView.as_view(), name='recomendacion-update'),
    path('recomendaciones/<int:pk>/delete/', views.RecommendationDeleteView.as_view(), name='recomendacion-delete'),

    # Dashboard & Stats (Manteniendo URIs originales para no quebrar frontend)
    path('inventory/stats/', views.InventoryStatsView.as_view(), name='inventory-stats'),
    path('inventory/categories/', views.InventoryCategoriesView.as_view(), name='inventory-categories'),
    path('sales/stats/', views.SaleStatsView.as_view(), name='sale-stats'),
    path('alerts/stats/', views.AlertStatsView.as_view(), name='alert-stats'),
    path('dashboard/chart/', views.DashboardChartView.as_view(), name='dashboard-chart'),
    path('auth/profile/', views.UserProfileView.as_view(), name='auth-profile'),
]
