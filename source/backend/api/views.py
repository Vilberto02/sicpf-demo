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
from django.db.models import Q, Sum, Count, F, Case, When, Value, IntegerField, CharField, DateField, Subquery, OuterRef
from django.utils import timezone

from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Categoria, Presentacion, Marca, Producto, Lote, PrediccionML, Alerta,
    Recomendacion, Cliente, Rol, Sede, Usuario, Venta, DetalleVenta,
    RegistroAuditoria, DIAS_HORIZONTE_VENCIMIENTO
)
from .serializers import (
    CategoriaSerializer, PresentacionSerializer, MarcaSerializer, ProductoSerializer, LoteSerializer,
    PrediccionMLSerializer, AlertaSerializer, RecomendacionSerializer,
    ClienteSerializer, RolSerializer, UsuarioSerializer, SedeSerializer,
    VentaSerializer, DetalleVentaSerializer, RegistroAuditoriaSerializer
)
from .permissions import IsOwnerOrAdmin, IsAdminUserRole, IsAdminOrReadOnly, CanCancelOrDeleteSale, is_admin_user
from .services import (
    CategoriaService, PresentacionService, MarcaService, ProductoService, LoteService,
    PrediccionMLService, AlertaService, RecomendacionService,
    ClienteService, RolService, UsuarioService, SedeService,
    VentaService, DetalleVentaService, AlertGenerationService, AuditService
)
from .pagination import CatalogPagination


def create_generic_views(model_service, model_serializer, permission_class=IsAuthenticated,
                         search_fields=None, ordering_fields=None, filterset_fields=None,
                         write_permission_class=None):
    _search_fields = search_fields or []
    _ordering_fields = ordering_fields or '__all__'
    _filterset_fields = filterset_fields
    _write_perm = write_permission_class or permission_class

    class ListView(generics.ListAPIView):
        permission_classes = [permission_class]
        serializer_class = model_serializer
        search_fields = _search_fields
        ordering_fields = _ordering_fields
        filterset_fields = _filterset_fields

        def get_queryset(self):
            return model_service.get_queryset()

    class CreateView(generics.CreateAPIView):
        permission_classes = [_write_perm]
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
        permission_classes = [_write_perm]
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
        permission_classes = [_write_perm]
        def delete(self, request, *args, **kwargs):
            model_service.delete(self.kwargs['pk'])
            return Response(status=status.HTTP_204_NO_CONTENT)

    return ListView, CreateView, DetailView, UpdateView, DeleteView

# Categoria Views (escritura solo Administrador)
CategoriaListView, CategoriaCreateView, CategoriaDetailView, CategoriaUpdateView, CategoriaDeleteView = create_generic_views(
    CategoriaService, CategoriaSerializer,
    search_fields=['nombre'],
    ordering_fields=['nombre'],
    write_permission_class=IsAdminUserRole,
)

# Presentacion Views (solo lectura para formularios)
PresentacionListView = create_generic_views(
    PresentacionService, PresentacionSerializer,
    ordering_fields=['nombre'],
)[0]

# Marca Views (escritura solo Administrador, lectura para todos autenticados)
MarcaListView, MarcaCreateView, MarcaDetailView, MarcaUpdateView, MarcaDeleteView = create_generic_views(
    MarcaService, MarcaSerializer,
    search_fields=['nombre'],
    ordering_fields=['nombre'],
    write_permission_class=IsAdminUserRole,
)

# Sede Views (solo lectura para formularios)
SedeListView = create_generic_views(
    SedeService, SedeSerializer,
    ordering_fields=['nombre'],
)[0]

# Producto Views (escritura solo Administrador)
ProductoListView, ProductoCreateView, ProductoDetailView, ProductoUpdateView, ProductoDeleteView = create_generic_views(
    ProductoService, ProductoSerializer,
    search_fields=['codigo', 'nombre', 'descripcion'],
    ordering_fields=['codigo', 'nombre', 'precio_real', 'created_at', 'categoria'],
    filterset_fields=['categoria', 'categoria__nombre'],
    write_permission_class=IsAdminUserRole,
)

# Lote Views (escritura solo Administrador)
LoteListView, LoteCreateView, LoteDetailView, LoteUpdateView, LoteDeleteView = create_generic_views(
    LoteService, LoteSerializer,
    search_fields=['codigo_lote', 'producto__nombre', 'producto__codigo', 'marca__nombre'],
    ordering_fields=['codigo_lote', 'fecha_vencimiento', 'stock_real', 'created_at', 'tipo_producto'],
    filterset_fields=['producto', 'producto__categoria__nombre', 'tipo_producto', 'marca'],
    write_permission_class=IsAdminUserRole,
)

# Cliente Views
ClienteListView, ClienteCreateView, ClienteDetailView, ClienteUpdateView, ClienteDeleteView = create_generic_views(
    ClienteService, ClienteSerializer,
    search_fields=['nombre', 'apellido', 'email', 'telefono'],
    ordering_fields=['nombre', 'apellido', 'email'],
)

_usuario_views = create_generic_views(
    UsuarioService, UsuarioSerializer,
    permission_class=IsOwnerOrAdmin,
    search_fields=['user__username', 'user__first_name', 'user__last_name', 'user__email'],
    ordering_fields=['user__first_name', 'user__last_name', 'user__email'],
)
UsuarioListView = _usuario_views[0]
UsuarioCreateView = _usuario_views[1]
UsuarioDetailView = _usuario_views[2]
UsuarioUpdateView = _usuario_views[3]


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
RolListView, RolCreateView, RolDetailView, RolUpdateView, RolDeleteView = create_generic_views(
    RolService, RolSerializer,
    permission_class=IsOwnerOrAdmin,
    ordering_fields=['nombre'],
)


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
_venta_views = create_generic_views(
    VentaService, VentaSerializer,
    search_fields=['codigo', 'cliente__nombre', 'usuario__user__first_name'],
    ordering_fields=['codigo', 'total', 'fecha', 'estado'],
    filterset_fields=['estado', 'cliente', 'usuario'],
)

class CustomVentaListView(_venta_views[0]):
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not is_admin_user(user):
            qs = qs.filter(usuario__user=user)
        return qs

class CustomVentaDetailView(_venta_views[2]):
    def get_object(self):
        obj = super().get_object()
        if not is_admin_user(self.request.user) and obj.usuario.user != self.request.user:
            raise PermissionDenied("No tienes permiso para consultar esta venta.")
        return obj

class CustomVentaUpdateView(_venta_views[3]):
    def get_object(self):
        obj = super().get_object()
        if not is_admin_user(self.request.user) and obj.usuario.user != self.request.user:
            raise PermissionDenied("No tienes permiso para modificar esta venta.")
        return obj

class CustomVentaDeleteView(_venta_views[4]):
    permission_classes = [CanCancelOrDeleteSale]

VentaListView = CustomVentaListView
VentaCreateView = _venta_views[1]
VentaDetailView = CustomVentaDetailView
VentaUpdateView = CustomVentaUpdateView
VentaDeleteView = CustomVentaDeleteView

# Alerta Views
AlertListView, AlertCreateView, AlertDetailView, AlertUpdateView, AlertDeleteView = create_generic_views(
    AlertaService, AlertaSerializer,
    search_fields=['alerta', 'producto__nombre'],
    ordering_fields=['fecha_alerta', 'nivel_riesgo', 'estado', 'created_at', 'estado_prioridad'],
    filterset_fields=['estado', 'tipo', 'origen', 'nivel_riesgo'],
)

# Recomendacion Views
RecommendationListView, RecommendationCreateView, RecommendationDetailView, RecommendationUpdateView, RecommendationDeleteView = create_generic_views(
    RecomendacionService, RecomendacionSerializer,
    search_fields=['titulo', 'descripcion'],
)


class ProductStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone as tz
        hoy = tz.localdate()

        lotes_by_producto = Lote.objects.filter(
            is_active=True,
            stock_real__gt=0
        ).values('producto').annotate(
            total_real=Sum('stock_real')
        )

        lotes_por_vencer = Lote.objects.filter(
            is_active=True,
            stock_real__gt=0,
            fecha_vencimiento__gt=hoy,
            fecha_vencimiento__lte=hoy + timedelta(days=DIAS_HORIZONTE_VENCIMIENTO)
        ).values('producto').annotate(
            total_real=Sum('stock_real')
        )

        lotes_vencidos = Lote.objects.filter(
            is_active=True,
            stock_real__gt=0,
            fecha_vencimiento__lte=hoy
        ).values('producto').annotate(
            total_real=Sum('stock_real')
        )

        ids_con_stock = set(d['producto'] for d in lotes_by_producto)
        ids_por_vencer = set(d['producto'] for d in lotes_por_vencer)
        ids_vencidos = set(d['producto'] for d in lotes_vencidos)

        total = Producto.objects.filter(is_active=True).count()
        activos = len(ids_con_stock - ids_vencidos)
        por_vencer = len(ids_por_vencer - ids_vencidos)
        vencidos = len(ids_vencidos)

        return Response({
            "total": total,
            "activos": activos,
            "por_vencer": por_vencer,
            "vencidos": vencidos,
        })


class InventoryStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from decimal import Decimal
        hoy = datetime.now().date()
        limite_por_vencer = hoy + timedelta(days=DIAS_HORIZONTE_VENCIMIENTO)

        agg = Lote.objects.filter(
            is_active=True,
            producto__is_active=True
        ).filter(
            Q(stock_real__gt=0) | Q(stock_flotante__gt=0)
        ).aggregate(
            total_lotes=Count('id'),
            low_stock=Count('id', filter=Q(stock_real__lte=15)),
            expiring_soon=Count('id', filter=Q(
                fecha_vencimiento__gt=hoy,
                fecha_vencimiento__lte=limite_por_vencer,
            )),
            expired=Count('id', filter=Q(fecha_vencimiento__lte=hoy)),
            inventory_value=Sum(
                F('stock_real') * F('producto__precio_real') +
                F('stock_flotante') * F('producto__precio_flotante')
            ),
        )

        return Response({
            "total_lotes": agg['total_lotes'] or 0,
            "inventory_value": float(agg['inventory_value'] or 0),
            "low_stock": agg['low_stock'] or 0,
            "expiring_soon": agg['expiring_soon'] or 0,
            "expired": agg['expired'] or 0,
        })


class SaleStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Venta.objects.all()
        user = request.user
        is_admin = user.is_superuser
        if hasattr(user, 'usuario') and user.usuario.rol and user.usuario.rol.nombre in ['Administrador', 'Superusuario']:
            is_admin = True
            
        if not is_admin:
            qs = qs.filter(usuario__user=user)

        total_orders = qs.count()
        pending_orders = qs.filter(estado="Pendiente").count()
        completed_orders = qs.filter(estado="Completado").count()

        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        total_revenue = qs.filter(
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
        today = datetime.now().date()
        agg = Alerta.objects.aggregate(
            total_alerts=Count('id'),
            quiebres_estimados=Count('id', filter=Q(tipo="quiebre")),
            critical_stock=Count('id', filter=Q(nivel_riesgo="alto")),
            at_risk=Count('id', filter=Q(nivel_riesgo="medio")),
            total_pendientes=Count('id', filter=Q(estado="pendiente")),
            generadas_hoy=Count('id', filter=Q(fecha_alerta=today)),
            origen_regla=Count('id', filter=Q(origen="reglas")),
            origen_ml=Count('id', filter=Q(origen="ml")),
        )

        return Response({
            "quiebres_estimados": agg['quiebres_estimados'],
            "critical_stock": agg['critical_stock'],
            "at_risk": agg['at_risk'],
            "total_pendientes": agg['total_pendientes'],
            "generadas_hoy": agg['generadas_hoy'],
            "origen_regla": agg['origen_regla'],
            "origen_ml": agg['origen_ml']
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
        pendientes = Alerta.objects.filter(estado='pendiente').select_related(
            'producto', 'producto__categoria', 'prediccion'
        )
        return Response(AlertaSerializer(pendientes, many=True).data)

class DashboardChartView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        five_months_ago = datetime.now().date() - timedelta(days=150)
        sales = Venta.objects.filter(
            fecha__gte=five_months_ago, estado="Completado"
        ).annotate(month=TruncMonth('fecha')).values('month').annotate(
            total=Sum('total'), count=Count('id')
        ).order_by('month')

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
        profile, _ = Usuario.objects.select_related('user', 'rol', 'sede').get_or_create(
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
        ventas_propias = Venta.objects.filter(usuario__user=request.user)
        ahora = timezone.localtime()
        inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        completadas = ventas_propias.filter(estado="Completado")
        ventas_mes = completadas.filter(fecha__gte=inicio_mes).aggregate(total=Sum("total"))
        ultimas = ventas_propias.select_related('cliente', 'usuario', 'usuario__user').prefetch_related(
            'detalles', 'detalles__producto'
        ).order_by("-fecha")[:5]

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


class LoteCatalogoView(generics.ListAPIView):
    """Endpoint ligero para autocompletado de lotes al crear ventas con priorización FEFO."""
    permission_classes = [IsAuthenticated]
    serializer_class = LoteSerializer
    pagination_class = CatalogPagination
    search_fields = ['codigo_lote', 'producto__nombre', 'producto__codigo', 'producto__dci', 'producto__registro_sanitario', 'marca__nombre']
    ordering_fields = ['producto__nombre', 'fecha_vencimiento', 'created_at']
    filterset_fields = ['producto', 'tipo_producto', 'marca', 'producto__condicion_venta']

    def get_queryset(self):
        return Lote.objects.select_related(
            'producto', 'producto__categoria', 'producto__presentacion', 'marca'
        ).filter(
            is_active=True,
            producto__is_active=True
        ).filter(
            Q(stock_real__gt=0) | Q(stock_flotante__gt=0)
        ).order_by('fecha_vencimiento', 'created_at')


class LogoutView(APIView):
    """POST /api/auth/logout/ - Invalida el refresh token en la lista negra y registra el evento."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {"detail": "Se requiere el refresh token para cerrar sesión."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            AuditService.registrar(
                accion='LOGOUT',
                tabla_afectada='AUTH',
                registro_id=request.user.id,
                detalles={'mensaje': 'Sesión cerrada y refresh token revocado'},
                request=request
            )
            return Response({"detail": "Sesión cerrada correctamente."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": f"Token inválido o ya revocado: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegistroAuditoriaListView(generics.ListAPIView):
    """GET /api/auditoria/ - Consulta de eventos de auditoría (exclusivo Administrador)."""
    permission_classes = [IsAdminUserRole]
    serializer_class = RegistroAuditoriaSerializer
    search_fields = ['usuario__username', 'accion', 'tabla_afectada', 'registro_id', 'ip_origen']
    ordering_fields = ['fecha', 'accion', 'tabla_afectada']
    filterset_fields = ['accion', 'tabla_afectada']

    def get_queryset(self):
        return RegistroAuditoria.objects.all().select_related('usuario')

