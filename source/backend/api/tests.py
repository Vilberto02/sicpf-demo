from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from decimal import Decimal
from .models import (
    Categoria, Presentacion, Producto, Lote, Cliente, Rol, Usuario,
    Venta, DetalleVenta, RegistroAuditoria, Alerta
)
from .services import CategoriaService, ProductoService


class CategoriaServiceTest(TestCase):
    def setUp(self):
        self.cat_data = {"nombre": "Analgésicos"}

    def test_create_categoria(self):
        cat = CategoriaService.create(self.cat_data)
        self.assertEqual(cat.nombre, "Analgésicos")
        self.assertEqual(Categoria.objects.count(), 1)

    def test_get_all_categorias(self):
        CategoriaService.create(self.cat_data)
        cats = CategoriaService.get_all()
        self.assertEqual(len(cats), 1)


class ProductoAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        # Obtener Token JWT normal
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'testuser',
            'password': 'testpassword'
        })
        self.token = response.data['access']

        # Admin User & Token
        self.admin_user = User.objects.create_superuser(username='adminuser', password='adminpassword')
        resp_admin = self.client.post(reverse('token_obtain_pair'), {
            'username': 'adminuser',
            'password': 'adminpassword'
        })
        self.admin_token = resp_admin.data['access']

        # Setup Data
        self.categoria = Categoria.objects.create(nombre="Antibióticos")
        self.presentacion = Presentacion.objects.create(nombre="Pastilla", abreviatura="past")
        self.producto_data = {
            "codigo": "PROD-TEST",
            "nombre": "Amoxicilina",
            "precio_real": "15.50",
            "precio_flotante": "1.55",
            "unidades_por_caja": 10,
            "presentacion": self.presentacion.id,
            "categoria": self.categoria.id
        }

    def test_list_productos_unauthorized(self):
        response = self.client.get(reverse('producto-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_producto_forbidden_for_regular_user(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        response = self.client.post(reverse('producto-create'), self.producto_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_producto_as_admin(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.admin_token)
        response = self.client.post(reverse('producto-create'), self.producto_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Producto.objects.filter(codigo="PROD-TEST").count(), 1)


    def test_list_productos(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        Producto.objects.create(
            codigo="PROD-TEST2", nombre="Penicilina", precio_real=Decimal("20.00"),
            precio_flotante=Decimal("2.00"), unidades_por_caja=10,
            presentacion=self.presentacion, categoria=self.categoria
        )
        response = self.client.get(reverse('producto-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Paginated response: {count, next, previous, results}
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_list_productos_search(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        Producto.objects.create(
            codigo="PROD-TEST", nombre="Amoxicilina", precio_real=Decimal("15.50"),
            precio_flotante=Decimal("1.55"), unidades_por_caja=10,
            presentacion=self.presentacion, categoria=self.categoria
        )
        Producto.objects.create(
            codigo="PROD-TEST2", nombre="Penicilina", precio_real=Decimal("20.00"),
            precio_flotante=Decimal("2.00"), unidades_por_caja=10,
            presentacion=self.presentacion, categoria=self.categoria
        )
        response = self.client.get(reverse('producto-list') + '?search=Amox')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['codigo'], 'PROD-TEST')

    def test_list_productos_ordering(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        Producto.objects.create(
            codigo="PROD-ZZZ", nombre="Zetamicina", precio_real=Decimal("20.00"),
            precio_flotante=Decimal("2.00"), unidades_por_caja=10,
            presentacion=self.presentacion, categoria=self.categoria
        )
        response = self.client.get(reverse('producto-list') + '?ordering=nombre')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p['nombre'] for p in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_list_productos_pagination(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        for i in range(25):
            Producto.objects.create(
                codigo=f"PROD-{i:03d}", nombre=f"Producto {i}", precio_real=Decimal("10.00"),
                precio_flotante=Decimal("1.00"), unidades_por_caja=10,
                presentacion=self.presentacion, categoria=self.categoria
        )
        response = self.client.get(reverse('producto-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 25)
        self.assertEqual(len(response.data['results']), 20)  # default page_size=20
        self.assertIsNotNone(response.data['next'])

    def test_lote_catalogo(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        producto = Producto.objects.create(
            codigo="PROD-CAT", nombre="Paracetamol", precio_real=Decimal("12.00"),
            precio_flotante=Decimal("1.20"), unidades_por_caja=10,
            presentacion=self.presentacion, categoria=self.categoria
        )
        Lote.objects.create(
            producto=producto, codigo_lote="LOT-001",
            fecha_vencimiento="2027-01-01", stock_real=50, stock_flotante=100
        )
        response = self.client.get(reverse('lote-catalogo'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['codigo_lote'], 'LOT-001')


class AlertaAPITest(TestCase):
    def setUp(self):
        from datetime import date
        from .models import Alerta
        self.client = APIClient()
        self.user = User.objects.create_user(username='testadmin', password='testpassword')
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'testadmin',
            'password': 'testpassword'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.categoria = Categoria.objects.create(nombre="Farmacia")
        self.presentacion = Presentacion.objects.create(nombre="Caja")
        self.producto = Producto.objects.create(
            codigo="PROD-ALERTA", nombre="Ibuprofeno 400mg", precio_real=Decimal("10.00"),
            precio_flotante=Decimal("1.00"), unidades_por_caja=10,
            presentacion=self.presentacion, categoria=self.categoria
        )

        # Crear 3 alertas en diferentes estados
        self.alerta_revisada = Alerta.objects.create(
            producto=self.producto, alerta="Alerta revisada", tipo="stock_bajo",
            nivel_riesgo="medio", periodo_agotamiento=10, stock_minimo=5,
            fecha_alerta=date.today(), estado="revisada"
        )
        self.alerta_descartada = Alerta.objects.create(
            producto=self.producto, alerta="Alerta descartada", tipo="vencimiento",
            nivel_riesgo="bajo", periodo_agotamiento=20, stock_minimo=5,
            fecha_alerta=date.today(), estado="descartada"
        )
        self.alerta_pendiente = Alerta.objects.create(
            producto=self.producto, alerta="Alerta pendiente", tipo="stock_critico",
            nivel_riesgo="alto", periodo_agotamiento=2, stock_minimo=5,
            fecha_alerta=date.today(), estado="pendiente"
        )

    def test_list_alertas_priority_ordering(self):
        """Verifica que las alertas pendientes aparezcan primero y las descartadas al final."""
        response = self.client.get(reverse('alerta-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]['id'], self.alerta_pendiente.id)
        self.assertEqual(results[1]['id'], self.alerta_revisada.id)
        self.assertEqual(results[2]['id'], self.alerta_descartada.id)

    def test_filter_alertas_by_estado(self):
        """Verifica el filtro por estado (pendiente, revisada, descartada)."""
        response_pen = self.client.get(reverse('alerta-list') + '?estado=pendiente')
        self.assertEqual(response_pen.status_code, status.HTTP_200_OK)
        self.assertEqual(response_pen.data['count'], 1)
        self.assertEqual(response_pen.data['results'][0]['estado'], 'pendiente')

        response_rev = self.client.get(reverse('alerta-list') + '?estado=revisada')
        self.assertEqual(response_rev.status_code, status.HTTP_200_OK)
        self.assertEqual(response_rev.data['count'], 1)
        self.assertEqual(response_rev.data['results'][0]['estado'], 'revisada')

    def test_mark_alerta_reviewed(self):
        """Verifica actualizar el estado de una alerta a revisada."""
        response = self.client.patch(
            reverse('alerta-update', kwargs={'pk': self.alerta_pendiente.id}),
            {'estado': 'revisada'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['estado'], 'revisada')


class SecurityAndAuditTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Rol y Usuario Vendedor
        self.rol_vendedor = Rol.objects.create(nombre="Vendedor", descripcion="Ventas")
        self.user_vendedor = User.objects.create_user(username='vendedor1', password='password123')
        self.perfil_vendedor = Usuario.objects.create(user=self.user_vendedor, rol=self.rol_vendedor)

        resp_vendedor = self.client.post(reverse('token_obtain_pair'), {
            'username': 'vendedor1',
            'password': 'password123'
        })
        self.token_vendedor = resp_vendedor.data['access']
        self.refresh_vendedor = resp_vendedor.data['refresh']

        # Rol y Usuario Administrador
        self.rol_admin = Rol.objects.create(nombre="Administrador", descripcion="Admin")
        self.user_admin = User.objects.create_superuser(username='adminboss', password='adminpassword')
        self.perfil_admin = Usuario.objects.create(user=self.user_admin, rol=self.rol_admin)

        resp_admin = self.client.post(reverse('token_obtain_pair'), {
            'username': 'adminboss',
            'password': 'adminpassword'
        })
        self.token_admin = resp_admin.data['access']

        # Datos base
        self.categoria = Categoria.objects.create(nombre="Farmacia")
        self.presentacion = Presentacion.objects.create(nombre="Caja")
        self.producto = Producto.objects.create(
            codigo="PROD-SEC-01",
            nombre="Ibuprofeno 400mg",
            precio_real=Decimal("20.00"),
            precio_flotante=Decimal("2.00"),
            precio_blister=Decimal("10.00"),
            unidades_por_caja=10,
            unidades_por_blister=5,
            blisters_por_caja=2,
            presentacion=self.presentacion,
            categoria=self.categoria
        )
        self.lote = Lote.objects.create(
            producto=self.producto,
            codigo_lote="LOTE-SEC-001",
            fecha_vencimiento=date(2028, 1, 1),
            stock_real=50,
            stock_flotante=0
        )
        self.cliente = Cliente.objects.create(
            nombre="Juan",
            apellido="Perez",
            email="juan@example.com"
        )

    def test_server_side_total_recalculation_and_stock_decrement(self):
        """El servidor ignora el total enviado por el cliente y recalcula el precio oficial."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_vendedor)
        payload = {
            "cliente": self.cliente.id,
            "total": "0.01",  # Intento de manipulación de precio
            "detalles_write": [
                {
                    "producto": self.producto.id,
                    "lote": self.lote.id,
                    "cantidad_real": 2,
                    "cantidad_flotante": 0,
                    "cantidad_blister": 0,
                    "precio_real": "0.01",  # Intento de alterar precio unitario
                    "precio_flotante": "0.00",
                    "precio_blister": "0.00",
                }
            ]
        }
        response = self.client.post(reverse('venta-create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # El total debe ser 2 cajas * S/ 20.00 = S/ 40.00
        self.assertEqual(Decimal(str(response.data['total'])), Decimal("40.00"))
        
        # Verificar descuento de stock en BD (50 - 2 = 48)
        self.lote.refresh_from_db()
        self.assertEqual(self.lote.stock_real, 48)

        # Verificar que se haya registrado en Auditoría
        auditoria = RegistroAuditoria.objects.filter(tabla_afectada="Venta", accion="CREACION").first()
        self.assertIsNotNone(auditoria)
        self.assertEqual(auditoria.usuario, self.user_vendedor)

    def test_sale_cancellation_requires_admin(self):
        """Un vendedor no puede cancelar ventas; solo un Administrador puede autorizarlo."""
        # Crear venta
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_vendedor)
        payload = {
            "cliente": self.cliente.id,
            "detalles_write": [{
                "producto": self.producto.id,
                "lote": self.lote.id,
                "cantidad_real": 5,
                "cantidad_flotante": 0,
                "cantidad_blister": 0,
            }]
        }
        resp = self.client.post(reverse('venta-create'), payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        venta_id = resp.data['id']
        
        self.lote.refresh_from_db()
        self.assertEqual(self.lote.stock_real, 45)

        # Vendedor intenta anular la venta -> Error 400 de validación con mensaje de admin requerido
        resp_cancel_seller = self.client.patch(
            reverse('venta-update', kwargs={'pk': venta_id}),
            {"estado": "Cancelado"},
            format='json'
        )
        self.assertEqual(resp_cancel_seller.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("autorización", str(resp_cancel_seller.data))

        # Admin anula la venta -> Permitido y stock repuesto
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_admin)
        resp_cancel_admin = self.client.patch(
            reverse('venta-update', kwargs={'pk': venta_id}),
            {"estado": "Cancelado"},
            format='json'
        )
        self.assertEqual(resp_cancel_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_cancel_admin.data['estado'], 'Cancelado')

        # Stock restituido a 50
        self.lote.refresh_from_db()
        self.assertEqual(self.lote.stock_real, 50)

        # Registro de anulación en Auditoría
        auditoria_anul = RegistroAuditoria.objects.filter(accion="ANULACION_VENTA", registro_id=str(venta_id)).first()
        self.assertIsNotNone(auditoria_anul)
        self.assertEqual(auditoria_anul.usuario, self.user_admin)

    def test_logout_token_blacklist(self):
        """Cerrar sesión envía el refresh token a la lista negra."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_vendedor)
        logout_resp = self.client.post(reverse('auth-logout'), {'refresh': self.refresh_vendedor}, format='json')
        self.assertEqual(logout_resp.status_code, status.HTTP_200_OK)

        # Intentar usar el refresh token revocado para refrescar access token
        refresh_resp = self.client.post(reverse('token_refresh'), {'refresh': self.refresh_vendedor}, format='json')
        self.assertEqual(refresh_resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_auditoria_endpoint_access_control(self):
        """El log de auditoría está restringido a Administradores."""
        # Vendedor intenta consultar auditoría -> 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_vendedor)
        resp_seller = self.client.get(reverse('registro-auditoria-list'))
        self.assertEqual(resp_seller.status_code, status.HTTP_403_FORBIDDEN)

        # Admin consulta auditoría -> 200 OK
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_admin)
        resp_admin = self.client.get(reverse('registro-auditoria-list'))
        self.assertEqual(resp_admin.status_code, status.HTTP_200_OK)


class AdminPanelEstadoTest(TestCase):
    def setUp(self):
        from django.contrib.admin.sites import AdminSite
        from api.admin import ProductoAdmin, LoteAdmin

        self.site = AdminSite()
        self.producto_admin = ProductoAdmin(Producto, self.site)
        self.lote_admin = LoteAdmin(Lote, self.site)

        self.user_admin = User.objects.create_superuser(username='admin_test', password='password123')
        self.categoria = Categoria.objects.create(nombre="Antibióticos")
        self.presentacion = Presentacion.objects.create(nombre="Tableta", abreviatura="TAB")

        self.producto = Producto.objects.create(
            codigo="MED-100",
            nombre="Amoxicilina 500mg",
            categoria=self.categoria,
            presentacion=self.presentacion,
            precio_real=Decimal("25.00"),
            precio_flotante=Decimal("1.50"),
            is_active=True
        )

        self.lote = Lote.objects.create(
            producto=self.producto,
            codigo_lote="LOT-2026-01",
            fecha_vencimiento=date.today() + timedelta(days=200),
            stock_real=50,
            stock_flotante=0,
            is_active=True
        )

    def test_producto_admin_columns_and_methods(self):
        """Verifica que ProductoAdmin incluya estado_registro y estado_vencimiento."""
        self.assertIn('estado_registro', self.producto_admin.list_display)
        self.assertIn('estado_vencimiento', self.producto_admin.list_display)

        # Producto activo
        self.assertTrue(self.producto_admin.estado_registro(self.producto))
        venc_html = self.producto_admin.estado_vencimiento(self.producto)
        self.assertIn("activo", venc_html)

        # Producto desactivado
        self.producto.is_active = False
        self.producto.save()
        self.assertFalse(self.producto_admin.estado_registro(self.producto))

    def test_producto_admin_actions(self):
        """Verifica acciones masivas de desactivar y activar productos con auditoría."""
        from django.test import RequestFactory
        from django.contrib.messages.storage.fallback import FallbackStorage
        factory = RequestFactory()
        request = factory.post('/admin/api/producto/')
        request.user = self.user_admin
        setattr(request, 'session', 'session')
        messages = FallbackStorage(request)
        setattr(request, '_messages', messages)

        # Desactivar
        qs = Producto.objects.filter(pk=self.producto.pk)
        self.producto_admin.desactivar_productos(request, qs)

        self.producto.refresh_from_db()
        self.assertFalse(self.producto.is_active)
        self.lote.refresh_from_db()
        self.assertFalse(self.lote.is_active)

        audit_deact = RegistroAuditoria.objects.filter(
            accion="ELIMINACION",
            tabla_afectada="Producto",
            registro_id=str(self.producto.pk)
        ).first()
        self.assertIsNotNone(audit_deact)
        self.assertEqual(audit_deact.detalles.get('tipo'), 'soft_delete_admin')

        # Reactivar
        self.producto_admin.activar_productos(request, qs)
        self.producto.refresh_from_db()
        self.assertTrue(self.producto.is_active)
        self.lote.refresh_from_db()
        self.assertTrue(self.lote.is_active)

    def test_lote_admin_columns_and_actions(self):
        """Verifica columnas y acciones de LoteAdmin."""
        self.assertIn('estado_registro', self.lote_admin.list_display)
        self.assertIn('estado_vencimiento', self.lote_admin.list_display)

        self.assertTrue(self.lote_admin.estado_registro(self.lote))
        venc_html = self.lote_admin.estado_vencimiento(self.lote)
        self.assertIn("activo", venc_html)

        from django.test import RequestFactory
        from django.contrib.messages.storage.fallback import FallbackStorage
        factory = RequestFactory()
        request = factory.post('/admin/api/lote/')
        request.user = self.user_admin
        setattr(request, 'session', 'session')
        messages = FallbackStorage(request)
        setattr(request, '_messages', messages)

        qs = Lote.objects.filter(pk=self.lote.pk)
        self.lote_admin.desactivar_lotes(request, qs)
        self.lote.refresh_from_db()
        self.assertFalse(self.lote.is_active)

        self.lote_admin.activar_lotes(request, qs)
        self.lote.refresh_from_db()
        self.assertTrue(self.lote.is_active)



