# pyrefly: ignore [missing-import]
from rest_framework import generics, status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from django.db.models import Sum, Count
# pyrefly: ignore [missing-import]
from .models import InventoryItem, Sale, Alert, UserProfile
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    InventoryItemSerializer, SaleSerializer, AlertSerializer, RecommendationSerializer
)
from .services import InventoryService, SaleService, AlertService, RecommendationService

def create_generic_views(model_service, model_serializer):
    class ListView(generics.ListAPIView):
        permission_classes = [IsAuthenticated]
        serializer_class = model_serializer
        def get_queryset(self):
            return model_service.get_all()

    class CreateView(generics.CreateAPIView):
        permission_classes = [IsAuthenticated]
        serializer_class = model_serializer
        def create(self, request, *args, **kwargs):
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            instance = model_service.create(serializer.validated_data)
            return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    class DetailView(generics.RetrieveAPIView):
        permission_classes = [IsAuthenticated]
        serializer_class = model_serializer
        def get_object(self):
            return model_service.get_by_id(self.kwargs['pk'])

    class UpdateView(generics.UpdateAPIView):
        permission_classes = [IsAuthenticated]
        serializer_class = model_serializer
        def update(self, request, *args, **kwargs):
            serializer = self.get_serializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            instance = model_service.update(self.kwargs['pk'], serializer.validated_data)
            return Response(self.get_serializer(instance).data)

    class DeleteView(generics.DestroyAPIView):
        permission_classes = [IsAuthenticated]
        def delete(self, request, *args, **kwargs):
            model_service.delete(self.kwargs['pk'])
            return Response(status=status.HTTP_204_NO_CONTENT)
            
    return ListView, CreateView, DetailView, UpdateView, DeleteView

# Inventory Views
InventoryListView, InventoryCreateView, InventoryDetailView, InventoryUpdateView, InventoryDeleteView = create_generic_views(
    InventoryService, InventoryItemSerializer
)

# Sale Views
SaleListView, SaleCreateView, SaleDetailView, SaleUpdateView, SaleDeleteView = create_generic_views(
    SaleService, SaleSerializer
)

# Alert Views
AlertListView, AlertCreateView, AlertDetailView, AlertUpdateView, AlertDeleteView = create_generic_views(
    AlertService, AlertSerializer
)

# Recommendation Views
RecommendationListView, RecommendationCreateView, RecommendationDetailView, RecommendationUpdateView, RecommendationDeleteView = create_generic_views(
    RecommendationService, RecommendationSerializer
)

class InventoryStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_products = InventoryItem.objects.count()
        low_stock = InventoryItem.objects.filter(stock_real__lte=15).count()
        expiring_soon = InventoryItem.objects.filter(status="Por vencer").count()
        return Response({
            "total_products": total_products,
            "low_stock": low_stock,
            "expiring_soon": expiring_soon
        })

class SaleStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_orders = Sale.objects.count()
        pending_orders = Sale.objects.filter(status="Pendiente").count()
        completed_orders = Sale.objects.filter(status="Completado").count()
        total_revenue = Sale.objects.filter(status="Completado").aggregate(total=Sum('monto'))['total'] or 0
        return Response({
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "total_revenue": float(total_revenue)
        })

class AlertStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_alerts = Alert.objects.count()
        high_trend = Alert.objects.filter(tendencia_consumo="Alta").count()
        consumption_trend = round((high_trend / total_alerts * 100) if total_alerts > 0 else 0, 1)
        critical_stock = Alert.objects.filter(status="Alto").count()
        at_risk = Alert.objects.filter(status="Medio").count()
        return Response({
            "consumption_trend": f"{consumption_trend} %",
            "critical_stock": critical_stock,
            "at_risk": at_risk
        })

class DashboardChartView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        five_months_ago = datetime.now().date() - timedelta(days=150)
        sales = Sale.objects.filter(fecha__gte=five_months_ago).annotate(month=TruncMonth('fecha')).values('month').annotate(total=Sum('monto'), count=Count('id')).order_by('month')
        
        labels = []
        dataset01 = []
        dataset02 = []
        
        for s in sales:
            if s['month']:
                month_name = s['month'].strftime("%B")
                if month_name not in labels:
                    labels.append(month_name)
                    dataset01.append(float(s['total'] or 0))
                    dataset02.append(s['count'] * 100) # scale up count to match scale visually or just use count
        
        # fallback if no data
        if not labels:
            labels = ["Enero", "Febrero", "Marzo", "Abril", "Mayo"]
            dataset01 = [120, 400, 700, 900, 1500]
            dataset02 = [80, 200, 400, 800, 1100]

        return Response({
            "labels": labels,
            "dataset01": dataset01,
            "dataset02": dataset02
        })

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        return Response({
            "first_name": user.first_name or user.username,
            "last_name": user.last_name,
            "email": user.email,
            "role": profile.role if profile else "Usuario",
            "location": profile.location if profile else "Sede Central",
            "employee_id": profile.employee_id if profile else "N/A"
        })

class InventoryCategoriesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        categories = InventoryItem.objects.values('categoria').annotate(count=Count('categoria')).order_by('-count')
        labels = [item['categoria'] for item in categories]
        values = [item['count'] for item in categories]
        return Response({
            "labels": labels,
            "values": values
        })
