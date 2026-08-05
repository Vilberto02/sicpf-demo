# pyrefly: ignore [missing-import]
from django.urls import path
from . import views

urlpatterns = [
    # Inventory
    path('inventory/', views.InventoryListView.as_view(), name='inventory-list'),
    path('inventory/create/', views.InventoryCreateView.as_view(), name='inventory-create'),
    path('inventory/<int:pk>/', views.InventoryDetailView.as_view(), name='inventory-detail'),
    path('inventory/<int:pk>/update/', views.InventoryUpdateView.as_view(), name='inventory-update'),
    path('inventory/<int:pk>/delete/', views.InventoryDeleteView.as_view(), name='inventory-delete'),
    
    # Sale
    path('sales/', views.SaleListView.as_view(), name='sale-list'),
    path('sales/create/', views.SaleCreateView.as_view(), name='sale-create'),
    path('sales/<int:pk>/', views.SaleDetailView.as_view(), name='sale-detail'),
    path('sales/<int:pk>/update/', views.SaleUpdateView.as_view(), name='sale-update'),
    path('sales/<int:pk>/delete/', views.SaleDeleteView.as_view(), name='sale-delete'),

    # Alert
    path('alerts/', views.AlertListView.as_view(), name='alert-list'),
    path('alerts/create/', views.AlertCreateView.as_view(), name='alert-create'),
    path('alerts/<int:pk>/', views.AlertDetailView.as_view(), name='alert-detail'),
    path('alerts/<int:pk>/update/', views.AlertUpdateView.as_view(), name='alert-update'),
    path('alerts/<int:pk>/delete/', views.AlertDeleteView.as_view(), name='alert-delete'),

    # Recommendation
    path('recommendations/', views.RecommendationListView.as_view(), name='recommendation-list'),
    path('recommendations/create/', views.RecommendationCreateView.as_view(), name='recommendation-create'),
    path('recommendations/<int:pk>/', views.RecommendationDetailView.as_view(), name='recommendation-detail'),
    path('recommendations/<int:pk>/update/', views.RecommendationUpdateView.as_view(), name='recommendation-update'),
    path('recommendations/<int:pk>/delete/', views.RecommendationDeleteView.as_view(), name='recommendation-delete'),
    
    # Stats
    path('inventory/stats/', views.InventoryStatsView.as_view(), name='inventory-stats'),
    path('inventory/categories/', views.InventoryCategoriesView.as_view(), name='inventory-categories'),
    path('sales/stats/', views.SaleStatsView.as_view(), name='sale-stats'),
    path('alerts/stats/', views.AlertStatsView.as_view(), name='alert-stats'),
    path('dashboard/chart/', views.DashboardChartView.as_view(), name='dashboard-chart'),
    path('auth/profile/', views.UserProfileView.as_view(), name='auth-profile'),
]
