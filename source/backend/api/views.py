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
from django.db.models import Q, Sum, Count

from .models import (
    Categoria, Presentacion, Producto, Lote, PrediccionML, Alerta,
    Recomendacion, Cliente, Rol, Sede, Usuario, Venta, DetalleVenta,
    DIAS_HORIZONTE_VENCIMIENTO
)
from .serializers import (
    CategoriaSerializer, PresentacionSerializer, ProductoSerializer, LoteSerializer,
    PrediccionMLSerializer, AlertaSerializer, RecomendacionSerializer,
    ClienteSerializer, RolSerializer, UsuarioSerializer, SedeSerializer,
    VentaSerializer, DetalleVentaSerializer
)
from .permissions import IsOwnerOrAdmin
from .services import (
    CategoriaService, PresentacionService, ProductoService, LoteService,
    PrediccionMLService, AlertaService, RecomendacionService,
    ClienteService, RolService, UsuarioService, SedeService,
    VentaService, DetalleVentaService, AlertGenerationService
)

def create_generic_views(model_service, model_serializer, permission_class=IsAuthenticated):
    class ListView(generics.ListAPIView):
        permission_classes = [permission_class]
        serializer_class = model_serializer
        def get_queryset(self):
            return model_service.get_all()

    class CreateView(generics.CreateAPIView):
        permission_classes = [permission_class]
        serializer_class = model_serializer
        def create(self, request, *args, **kwargs):
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()
            return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    class DetailView(generics.RetrieveAPIView):
        permission_classes = [permission_class]
        serializer_class = model_serializer
        def get_object(self):
            return model_service.get_by_id(self.kwargs['pk'])

    class UpdateView(generics.UpdateAPIView):
        permission_classes = [permission_class]
        serializer_class = model_serializer
        def get_object(self):
            return model_service.get_by_id(self.kwargs['pk'])
        def update(self, request, *args, **kwargs):
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()
            return Response(self.get_serializer(instance).data)

    class DeleteView(generics.DestroyAPIView):
        permission_classes = [permission_class]
        def delete(self, request, *args, **kwargs):
            model_service.delete(self.kwargs['pk'])
            return Response(status=status.HTTP_204_NO_CONTENT)

    return ListView, CreateView, DetailView, UpdateView, DeleteView

# Categoria Views
CategoriaListView, CategoriaCreateView, CategoriaDetailView, CategoriaUpdateView, CategoriaDeleteView = create_generic_views(CategoriaService, CategoriaSerializer)

# Presentacion Views (solo lectura para formularios)
PresentacionListView = create_generic_views(PresentacionService, PresentacionSerializer)[0]
# Sede Views (solo lectura para formularios)
SedeListView = create_generic_views(SedeService, SedeSerializer)[0]
# Producto Views
ProductoListView, ProductoCreateView, ProductoDetailView, ProductoUpdateView, ProductoDeleteView = create_generic_views(ProductoService, ProductoSerializer)

# Lote Views
LoteListView, LoteCreateView, LoteDetailView, LoteUpdateView, LoteDeleteView = create_generic_views(LoteService, LoteSerializer)

# Cliente Views
ClienteListView, ClienteCreateView, ClienteDetailView, ClienteUpdateView, ClienteDeleteView = create_generic_views(ClienteService, ClienteSerializer)

# Usuario Views (solo dueño/administrador)
UsuarioListView, UsuarioCreateView, UsuarioDetailView, UsuarioUpdateView = create_generic_views(UsuarioService, UsuarioSerializer, permission_class=IsOwnerOrAdmin)[:4]


class UsuarioDeleteView(APIView):
    """DELETE elimina el perfil y tambien el User de Django relacionado."""
    permission_classes = [IsOwnerOrAdmin]

    def delete(self, request, pk):
        usuario = UsuarioService.get_by_id(pk)
        user = usuario.user
        usuario.delete()
        if user:
            user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Rol Views (solo dueño/administrador)
RolListView, RolCreateView, RolDetailView, RolUpdateView, RolDeleteView = create_generic_views(RolService, RolSerializer, permission_class=IsOwnerOrAdmin)


class UsuarioToggleActiveView(APIView):
    """PATCH /api/usuarios/<pk>/active/ - Activa/desactiva el acceso de un usuario."""
    permission_classes = [IsOwnerOrAdmin]

    def patch(self, request, pk):
        usuario = UsuarioService.get_by_id(pk)
        is_active = bool(request.data.get('is_active', not usuario.user.is_active))
        usuario.user.is_active = is_active
        usuario.user.save()
        return Response(UsuarioSerializer(usuario).data)


# Venta Views
VentaListView, VentaCreateView, VentaDetailView, VentaUpdateView, VentaDeleteView = create_generic_views(VentaService, VentaSerializer)

# Alerta Views
AlertListView, AlertCreateView, AlertDetailView, AlertUpdateView, AlertDeleteView = create_generic_views(AlertaService, AlertaSerializer)

# Recomendacion Views
RecommendationListView, RecommendationCreateView, RecommendationDetailView, RecommendationUpdateView, RecommendationDeleteView = create_generic_views(RecomendacionService, RecomendacionSerializer)


class ProductStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        productos = Producto.objects.all()
        stats = {"total": len(productos), "activos": 0, "por_vencer": 0, "vencidos": 0}
        for producto in productos:
            estado = producto.estado
            if estado == "vencido":
                stats["vencidos"] += 1
            elif estado == "por vencer":
                stats["por_vencer"] += 1
            else:
                stats["activos"] += 1
        return Response(stats)


class InventoryStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from decimal import Decimal
        total_lotes = Lote.objects.count()
        # Sumamos el stock_real de todos los lotes y agrupamos por producto para ver cuáles tienen poco stock.
        # Una forma más sencilla para el demo: Lotes con poco stock real.
        low_stock = Lote.objects.filter(stock_real__lte=15).count()
        
        hoy = datetime.now().date()
        limite_por_vencer = hoy + timedelta(days=DIAS_HORIZONTE_VENCIMIENTO)
        lotes_con_stock = Lote.objects.filter(
            Q(stock_real__gt=0) | Q(stock_flotante__gt=0)
        )
        expiring_soon = lotes_con_stock.filter(
            fecha_vencimiento__gt=hoy,
            fecha_vencimiento__lte=limite_por_vencer
        ).count()
        expired = lotes_con_stock.filter(fecha_vencimiento__lte=hoy).count()

        inventory_value = Decimal("0")
        for lote in lotes_con_stock.select_related("producto"):
            inventory_value += (
                Decimal(lote.stock_real) * lote.producto.precio_real
                + Decimal(lote.stock_flotante) * lote.producto.precio_flotante
            )
        
        return Response({
            "total_lotes": total_lotes,
            "inventory_value": float(inventory_value),
            "low_stock": low_stock,
            "expiring_soon": expiring_soon,
            "expired": expired
        })

class SaleStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_orders = Venta.objects.count()
        pending_orders = Venta.objects.filter(estado="Pendiente").count()
        completed_orders = Venta.objects.filter(estado="Completado").count()
        
        # Total revenue of the current week
        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        total_revenue = Venta.objects.filter(
            estado="Completado", 
            fecha__gte=start_of_week
        ).aggregate(total=Sum('total'))['total'] or 0
        
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

        quiebres_estimados = Alerta.objects.filter(tipo="quiebre").count()
        critical_stock = Alerta.objects.filter(nivel_riesgo="alto").count()
        at_risk = Alerta.objects.filter(nivel_riesgo="medio").count()
        total_pendientes = Alerta.objects.filter(estado="pendiente").count()
        
        today = datetime.now().date()
        generadas_hoy = Alerta.objects.filter(fecha_alerta=today).count()
        
        origen_regla = Alerta.objects.filter(origen="reglas").count()
        origen_ml = Alerta.objects.filter(origen="ml").count()
        
        return Response({
            "quiebres_estimados": quiebres_estimados,
            "critical_stock": critical_stock,
            "at_risk": at_risk,
            "total_pendientes": total_pendientes,
            "generadas_hoy": generadas_hoy,
            "origen_regla": origen_regla,
            "origen_ml": origen_ml
        })


class AlertGenerateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        alertas = AlertGenerationService.generate_all()
        return Response({
            'generadas': len(alertas),
            'alertas': AlertaSerializer(alertas, many=True).data
        })


class AlertPendingView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        pendientes = Alerta.objects.filter(estado='pendiente')
        return Response(AlertaSerializer(pendientes, many=True).data)

class DashboardChartView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        five_months_ago = datetime.now().date() - timedelta(days=150)
        sales = Venta.objects.filter(fecha__gte=five_months_ago, estado="Completado").annotate(month=TruncMonth('fecha')).values('month').annotate(total=Sum('total'), count=Count('id')).order_by('month')
        
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

def _perfil_payload(profile):
    """Arma la respuesta del perfil a partir del User y su Usuario."""
    user = profile.user
    sede_nombre = profile.sede.nombre if profile.sede else None
    return {
        "id": profile.id,
        "first_name": user.first_name or user.username,
        "last_name": user.last_name,
        "email": user.email,
        "role": profile.rol.nombre if profile.rol else ("Superusuario" if user.is_superuser else "Usuario"),
        "sede": profile.sede_id,
        "location": sede_nombre or profile.direccion or "Sede Central",
        "employee_id": f"EMP-{str(profile.id).zfill(4)}",
        "phone": profile.telefono or "No registrado",
        "date_joined": user.date_joined.strftime("%Y-%m-%d") if user.date_joined else "Reciente",
    }


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = Usuario.objects.get_or_create(
            user=request.user,
            defaults={
                "telefono": "",
                "direccion": "",
            },
        )
        return Response(_perfil_payload(profile))

    def patch(self, request):
        """El usuario edita solo sus datos personales (no username ni password)."""
        profile, _ = Usuario.objects.get_or_create(
            user=request.user,
            defaults={"telefono": "", "direccion": ""},
        )
        data = request.data
        user = request.user

        campos_user = {"first_name", "last_name", "email"}
        if any(campo in data for campo in campos_user):
            email_nuevo = data.get("email")
            if email_nuevo:
                email_ocupado = Usuario.objects.filter(
                    user__email__iexact=email_nuevo
                ).exclude(user=user).exists()
                if email_ocupado:
                    return Response(
                        {"email": "Ya existe un usuario con ese email."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            if "first_name" in data:
                user.first_name = (data["first_name"] or "").strip()
            if "last_name" in data:
                user.last_name = (data["last_name"] or "").strip()
            if "email" in data:
                user.email = (data["email"] or "").strip()
            user.save()

        if "phone" in data:
            profile.telefono = data["phone"] or ""
        if "sede" in data:
            sede_id = data.get("sede")
            if sede_id:
                try:
                    profile.sede = Sede.objects.get(pk=sede_id)
                except Sede.DoesNotExist:
                    return Response(
                        {"sede": "La sede indicada no existe."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                profile.sede = None
        profile.save()

        return Response(_perfil_payload(profile))


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ - cambio propio exigiendo la clave actual."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not current_password or not new_password:
            return Response(
                {"detail": "Debes enviar current_password y new_password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.check_password(current_password):
            return Response(
                {"current_password": "La contraseña actual es incorrecta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # pyrefly: ignore [missing-import]
        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(new_password, user=request.user)
        except Exception as e:
            return Response({"new_password": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        return Response({
            "detail": "Contraseña actualizada correctamente.",
            "logout_required": True,
        })


class MySaleStatsView(APIView):
    """GET /api/sales/stats/mine/ - estadisticas de ventas del propio usuario."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone

        ventas_propias = Venta.objects.filter(usuario__user=request.user)
        ahora = timezone.localtime()
        inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        completadas = ventas_propias.filter(estado="Completado")
        ventas_mes = completadas.filter(fecha__gte=inicio_mes).aggregate(total=Sum("total"))
        ultimas = ventas_propias.order_by("-fecha")[:5]

        return Response({
            "total_orders": ventas_propias.count(),
            "completed_orders": completadas.count(),
            "month_orders": ventas_propias.filter(fecha__gte=inicio_mes).count(),
            "month_revenue": float(ventas_mes["total"] or 0),
            "recent_sales": VentaSerializer(ultimas, many=True).data,
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
