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

from .models import (
    Categoria, Producto, Lote, PrediccionML, Alerta, 
    Recomendacion, Cliente, Rol, Usuario, Venta, DetalleVenta
)
from .serializers import (
    CategoriaSerializer, ProductoSerializer, LoteSerializer,
    PrediccionMLSerializer, AlertaSerializer, RecomendacionSerializer,
    ClienteSerializer, RolSerializer, UsuarioSerializer,
    VentaSerializer, DetalleVentaSerializer
)
from .services import (
    CategoriaService, ProductoService, LoteService,
    PrediccionMLService, AlertaService, RecomendacionService,
    ClienteService, RolService, UsuarioService,
    VentaService, DetalleVentaService
)

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

# Categoria Views
CategoriaListView, CategoriaCreateView, CategoriaDetailView, CategoriaUpdateView, CategoriaDeleteView = create_generic_views(CategoriaService, CategoriaSerializer)

# Producto Views
ProductoListView, ProductoCreateView, ProductoDetailView, ProductoUpdateView, ProductoDeleteView = create_generic_views(ProductoService, ProductoSerializer)

# Lote Views
LoteListView, LoteCreateView, LoteDetailView, LoteUpdateView, LoteDeleteView = create_generic_views(LoteService, LoteSerializer)

# Cliente Views
ClienteListView, ClienteCreateView, ClienteDetailView, ClienteUpdateView, ClienteDeleteView = create_generic_views(ClienteService, ClienteSerializer)

# Usuario Views
UsuarioListView, UsuarioCreateView, UsuarioDetailView, UsuarioUpdateView, UsuarioDeleteView = create_generic_views(UsuarioService, UsuarioSerializer)

# Venta Views
VentaListView, VentaCreateView, VentaDetailView, VentaUpdateView, VentaDeleteView = create_generic_views(VentaService, VentaSerializer)

# Alerta Views
AlertListView, AlertCreateView, AlertDetailView, AlertUpdateView, AlertDeleteView = create_generic_views(AlertaService, AlertaSerializer)

# Recomendacion Views
RecommendationListView, RecommendationCreateView, RecommendationDetailView, RecommendationUpdateView, RecommendationDeleteView = create_generic_views(RecomendacionService, RecomendacionSerializer)


class InventoryStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_products = Producto.objects.count()
        # Sumamos el stock_real de todos los lotes y agrupamos por producto para ver cuáles tienen poco stock.
        # Una forma más sencilla para el demo: Lotes con poco stock real.
        low_stock = Lote.objects.filter(stock_real__lte=15).count()
        expiring_soon = Producto.objects.filter(estado="por vencer").count()
        return Response({
            "total_products": total_products,
            "low_stock": low_stock,
            "expiring_soon": expiring_soon
        })

class SaleStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_orders = Venta.objects.count()
        pending_orders = Venta.objects.filter(estado="cancelado").count() # Adaptado a cancelado/completado/finalizado
        completed_orders = Venta.objects.filter(estado="completado").count()
        total_revenue = Venta.objects.filter(estado__in=["completado", "finalizado"]).aggregate(total=Sum('total'))['total'] or 0
        return Response({
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "total_revenue": float(total_revenue)
        })

class AlertStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_alerts = Alerta.objects.count()
        
        # Obtenemos cuántas alertas vienen de predicciones con tendencia alta
        high_trend = Alerta.objects.filter(prediccion__tendencia_consumo="alta").count()
        consumption_trend = round((high_trend / total_alerts * 100) if total_alerts > 0 else 0, 1)
        
        critical_stock = Alerta.objects.filter(nivel_riesgo="alto").count()
        at_risk = Alerta.objects.filter(nivel_riesgo="medio").count()
        
        return Response({
            "consumption_trend": f"{consumption_trend} %",
            "critical_stock": critical_stock,
            "at_risk": at_risk
        })

class DashboardChartView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        five_months_ago = datetime.now().date() - timedelta(days=150)
        sales = Venta.objects.filter(fecha__gte=five_months_ago, estado__in=["completado", "finalizado"]).annotate(month=TruncMonth('fecha')).values('month').annotate(total=Sum('total'), count=Count('id')).order_by('month')
        
        labels = []
        dataset01 = []
        dataset02 = []
        
        for s in sales:
            if s['month']:
                month_name = s['month'].strftime("%B")
                if month_name not in labels:
                    labels.append(month_name)
                    dataset01.append(float(s['total'] or 0))
                    dataset02.append(s['count'] * 100) 
        
        return Response({
            "labels": labels,
            "dataset01": dataset01,
            "dataset02": dataset02
        })

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        try:
            profile = user.usuario_perfil
            return Response({
                "first_name": profile.nombre,
                "last_name": profile.apellido,
                "email": profile.email,
                "role": profile.rol.nombre if profile.rol else "Usuario",
                "location": profile.direccion or "Sede Central",
                "employee_id": f"EMP-{str(profile.id).zfill(4)}",
                "phone": profile.telefono or "No registrado",
                "date_joined": user.date_joined.strftime("%Y-%m-%d") if user.date_joined else "Reciente"
            })
        except:
            return Response({
                "first_name": user.first_name or user.username,
                "last_name": user.last_name,
                "email": user.email,
                "role": "Superusuario" if user.is_superuser else "Usuario",
                "location": "Sede Central",
                "employee_id": f"EMP-{str(user.id).zfill(4)}",
                "phone": "No registrado",
                "date_joined": user.date_joined.strftime("%Y-%m-%d") if user.date_joined else "Reciente"
            })

class InventoryCategoriesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        categories = Producto.objects.values('categoria__nombre').annotate(count=Count('categoria')).order_by('-count')
        labels = [item['categoria__nombre'] for item in categories]
        values = [item['count'] for item in categories]
        return Response({
            "labels": labels,
            "values": values
        })
