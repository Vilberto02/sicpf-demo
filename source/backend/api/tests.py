from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from decimal import Decimal
from .models import (
    Categoria, Presentacion, Marca, FormaFarmaceutica, Producto, Lote, Cliente, Rol, Usuario,
    Venta, DetalleVenta, RegistroAuditoria, Alerta, Sede, MetodoPago
)
from .services import CategoriaService, ProductoService


class NeutralBusinessTest(TestCase):
    def test_new_business_is_neutral_and_valid_in_admin(self):
        from .models import Negocio
        from .admin import NegocioAdmin
        from django.contrib.admin.sites import AdminSite

        negocio = Negocio.get_solo()
        self.assertEqual(negocio.nombre_comercial, 'SICPF')
        for field in ['razon_social', 'ruc', 'direccion', 'departamento', 'provincia', 'distrito', 'url_consulta']:
            self.assertEqual(getattr(negocio, field), '')
        self.assertEqual(negocio.mensaje_pie, '¡GRACIAS POR SU COMPRA!')
        self.assertEqual(negocio.leyenda_software, 'Generado por SICPF')
        negocio.full_clean()
        form = NegocioAdmin(Negocio, AdminSite()).get_form(None)
        for field in ['razon_social', 'ruc', 'direccion', 'url_consulta']:
            self.assertFalse(form.base_fields[field].required)

    def test_endpoint_preserves_configured_business(self):
        from .models import Negocio

        negocio = Negocio.objects.create(nombre_comercial='Farmacia de ejemplo', ruc='00000000000')
        client = APIClient()
        client.force_authenticate(User.objects.create_user(username='business-reader'))
        response = client.get('/api/negocio/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['nombre_comercial'], negocio.nombre_comercial)
        self.assertEqual(response.data['ruc'], negocio.ruc)
        self.assertEqual(Negocio.objects.count(), 1)


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

    def test_propiedades_tributarias_sunat(self):
        """Verifica que el modelo y API calculen op_gravada, igv y subtotal según SUNAT sin perder centavos."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_vendedor)
        payload = {
            "cliente": self.cliente.id,
            "detalles_write": [
                {
                    "producto": self.producto.id,
                    "lote": self.lote.id,
                    "cantidad_real": 2,  # 2 cajas * 20 = S/ 40.00
                    "cantidad_flotante": 0,
                    "cantidad_blister": 0,
                }
            ]
        }
        resp = self.client.post(reverse('venta-create'), payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        
        # 40.00 / 1.18 = 33.8983... -> op_gravada = 33.90
        # igv = 40.00 - 33.90 = 6.10
        # subtotal = 33.90
        self.assertEqual(Decimal(str(resp.data['total'])), Decimal("40.00"))
        self.assertEqual(Decimal(str(resp.data['op_gravada'])), Decimal("33.90"))
        self.assertEqual(Decimal(str(resp.data['igv'])), Decimal("6.10"))
        self.assertEqual(Decimal(str(resp.data['subtotal'])), Decimal("33.90"))
        self.assertEqual(
            Decimal(str(resp.data['op_gravada'])) + Decimal(str(resp.data['igv'])),
            Decimal(str(resp.data['total']))
        )

    def test_validacion_sunat_dni_mayor_700_sin_dni(self):
        """Ventas mayores a S/ 700.00 son rechazadas en el backend si el cliente no tiene DNI de 8 dígitos."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_vendedor)
        # 40 cajas * S/ 20.00 = S/ 800.00 (> 700)
        payload = {
            "cliente": self.cliente.id,  # self.cliente no tiene DNI
            "detalles_write": [
                {
                    "producto": self.producto.id,
                    "lote": self.lote.id,
                    "cantidad_real": 40,
                    "cantidad_flotante": 0,
                    "cantidad_blister": 0,
                }
            ]
        }
        resp = self.client.post(reverse('venta-create'), payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("SUNAT", str(resp.data))
        self.assertIn("700", str(resp.data))

    def test_validacion_sunat_dni_mayor_700_con_dni_valido(self):
        """Ventas mayores a S/ 700.00 son aceptadas si el cliente cuenta con DNI de 8 dígitos."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token_vendedor)
        cliente_con_dni = Cliente.objects.create(
            nombre="Carlos",
            apellido="Gomez",
            dni="71234567"
        )
        payload = {
            "cliente": cliente_con_dni.id,
            "detalles_write": [
                {
                    "producto": self.producto.id,
                    "lote": self.lote.id,
                    "cantidad_real": 40,  # S/ 800.00
                    "cantidad_flotante": 0,
                    "cantidad_blister": 0,
                }
            ]
        }
        resp = self.client.post(reverse('venta-create'), payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(resp.data['total'])), Decimal("800.00"))
        self.assertEqual(resp.data['cliente_dni'], "71234567")

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


class MarcaAndLoteTipoTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='farmaceutico', password='password123')
        self.rol = Rol.objects.create(nombre="Farmacéutico", descripcion="Farmacia")
        self.perfil = Usuario.objects.create(user=self.user, rol=self.rol)

        resp = self.client.post(reverse('token_obtain_pair'), {
            'username': 'farmaceutico',
            'password': 'password123'
        })
        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.categoria = Categoria.objects.create(nombre="Analgésicos")
        self.presentacion = Presentacion.objects.create(nombre="Caja", abreviatura="CJ")
        self.marca_bayer = Marca.objects.create(nombre="Bayer", descripcion="Laboratorio Bayer")
        self.marca_genfar = Marca.objects.create(nombre="Genfar", descripcion="Genéricos Genfar")

        self.producto = Producto.objects.create(
            codigo="MED-200",
            nombre="Paracetamol 500mg",
            categoria=self.categoria,
            presentacion=self.presentacion,
            precio_real=Decimal("15.00"),
            precio_flotante=Decimal("1.00"),
            is_active=True
        )

    def test_lote_marca_and_generico_creation_and_serialization(self):
        """Verifica que un lote pueda ser de marca o genérico con FK a Marca."""
        lote_marca = Lote.objects.create(
            producto=self.producto,
            codigo_lote="LOT-BAYER-01",
            fecha_vencimiento=date.today() + timedelta(days=365),
            stock_real=20,
            stock_flotante=0,
            tipo_producto="marca",
            marca=self.marca_bayer,
            is_active=True
        )

        lote_gen = Lote.objects.create(
            producto=self.producto,
            codigo_lote="LOT-GEN-01",
            fecha_vencimiento=date.today() + timedelta(days=365),
            stock_real=30,
            stock_flotante=0,
            tipo_producto="generico",
            marca=None,
            is_active=True
        )

        # Consultar detalle del lote por API
        resp = self.client.get(reverse('lote-detail', kwargs={'pk': lote_marca.id}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['tipo_producto'], 'marca')
        self.assertEqual(resp.data['marca'], self.marca_bayer.id)
        self.assertEqual(resp.data['marca_nombre'], 'Bayer')

        resp_gen = self.client.get(reverse('lote-detail', kwargs={'pk': lote_gen.id}))
        self.assertEqual(resp_gen.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_gen.data['tipo_producto'], 'generico')
        self.assertIsNone(resp_gen.data['marca'])
        self.assertIsNone(resp_gen.data['marca_nombre'])

    def test_producto_tipo_producto_and_marcas_disponibles(self):
        """Verifica la propiedad calculada de tipo_producto y marcas_disponibles en Producto."""
        # Sin lotes
        self.assertEqual(self.producto.tipo_producto, "sin lotes")
        self.assertEqual(self.producto.marcas_disponibles, [])

        # Solo lotes de marca
        lote1 = Lote.objects.create(
            producto=self.producto,
            codigo_lote="LOT-M-1",
            fecha_vencimiento=date.today() + timedelta(days=300),
            stock_real=10,
            tipo_producto="marca",
            marca=self.marca_bayer
        )
        self.assertEqual(self.producto.tipo_producto, "marca")
        self.assertIn("Bayer", self.producto.marcas_disponibles)

        # Agregar lote genérico -> se vuelve mixto
        lote2 = Lote.objects.create(
            producto=self.producto,
            codigo_lote="LOT-G-1",
            fecha_vencimiento=date.today() + timedelta(days=300),
            stock_real=10,
            tipo_producto="generico",
            marca=None
        )
        self.assertEqual(self.producto.tipo_producto, "mixto")

    def test_marcas_list_api(self):
        """Verifica que el endpoint /api/marcas/ liste las marcas registradas."""
        resp = self.client.get(reverse('marca-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data)
        self.assertEqual(len(results), 2)
        nombres = [m['nombre'] for m in results]
        self.assertIn('Bayer', nombres)
        self.assertIn('Genfar', nombres)

    def test_forma_farmaceutica_crud_and_product_fk(self):
        """Verifica la creación de FormaFarmaceutica y su vinculación como FK en Producto."""
        forma = FormaFarmaceutica.objects.create(nombre="Jarabe", descripcion="Líquido viscoso")
        self.producto.forma_farmaceutica = forma
        self.producto.save()

        # Endpoint listar formas farmacéuticas
        resp = self.client.get(reverse('forma-farmaceutica-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data)
        self.assertTrue(any(f['nombre'] == 'Jarabe' for f in results))

        # Endpoint detalle producto expone forma_farmaceutica_nombre
        resp_prod = self.client.get(reverse('producto-detail', kwargs={'pk': self.producto.pk}))
        self.assertEqual(resp_prod.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_prod.data['forma_farmaceutica'], forma.id)
        self.assertEqual(resp_prod.data['forma_farmaceutica_nombre'], "Jarabe")


class MetodoPagoAndVentaSedeTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.rol_admin = Rol.objects.create(nombre="Administrador")
        self.admin_user = User.objects.create_user(
            username='admin_pos',
            password='Password123!',
            first_name='Admin',
            last_name='Sistema'
        )
        self.sede_central = Sede.objects.create(
            nombre="Sede Central Huaral",
            direccion="Calle Derecha 456, Huaral"
        )
        self.admin_perfil = Usuario.objects.create(
            user=self.admin_user,
            rol=self.rol_admin,
            sede=self.sede_central
        )

        resp = self.client.post(reverse('token_obtain_pair'), {
            'username': 'admin_pos',
            'password': 'Password123!'
        })
        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.metodo_efectivo, _ = MetodoPago.objects.get_or_create(nombre="Efectivo", defaults={"descripcion": "Pago en efectivo"})
        self.metodo_yape, _ = MetodoPago.objects.get_or_create(nombre="Yape", defaults={"descripcion": "Billetera digital"})

        self.categoria = Categoria.objects.create(nombre="Medicamentos")
        self.presentacion = Presentacion.objects.create(nombre="Caja", abreviatura="CJ")
        self.producto = Producto.objects.create(
            codigo="PROD-TEST-1",
            nombre="Ibuprofeno 400mg",
            categoria=self.categoria,
            presentacion=self.presentacion,
            precio_real=Decimal("10.00"),
            precio_flotante=Decimal("1.00"),
            precio_blister=Decimal("5.00"),
            is_active=True
        )
        self.lote = Lote.objects.create(
            producto=self.producto,
            codigo_lote="LOT-IBU-01",
            fecha_vencimiento=date.today() + timedelta(days=200),
            stock_real=50,
            stock_flotante=100,
            is_active=True
        )
        self.cliente = Cliente.objects.create(
            nombre="Juan",
            apellido="Pérez",
            dni="12345678",
            email="juan.perez@example.com"
        )

    def test_metodos_pago_list_and_create(self):
        """Verifica listar métodos de pago y crear un nuevo método con rol Administrador."""
        resp = self.client.get(reverse('metodo-pago-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data)
        nombres = [m['nombre'] for m in results]
        self.assertIn('Efectivo', nombres)
        self.assertIn('Yape', nombres)

        # Crear nuevo método que no exista
        create_resp = self.client.post(reverse('metodo-pago-create'), {
            'nombre': 'Culqi',
            'descripcion': 'Pasarela Culqi'
        })
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_resp.data['nombre'], 'Culqi')


    def test_venta_asigna_sede_y_metodo_pago(self):
        """Verifica que al crear una venta se asigne la sede del vendedor y el método de pago especificado."""
        payload = {
            'tipo_comprobante': 'Boleta',
            'cliente': self.cliente.id,
            'metodo_pago': self.metodo_yape.id,
            'detalles_write': [
                {
                    'producto': self.producto.id,
                    'lote': self.lote.id,
                    'cantidad_real': 2,
                    'cantidad_flotante': 0,
                    'cantidad_blister': 0
                }
            ]
        }
        resp = self.client.post(reverse('venta-create'), payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        venta_id = resp.data['id']
        venta = Venta.objects.get(id=venta_id)

        # Debe asociar la sede del perfil del usuario en sesión
        self.assertEqual(venta.sede, self.sede_central)
        self.assertEqual(venta.metodo_pago, self.metodo_yape)

        # Serializer de venta debe exponer los campos de lectura
        self.assertEqual(resp.data['sede'], self.sede_central.id)
        self.assertEqual(resp.data['sede_nombre'], 'Sede Central Huaral')
        self.assertEqual(resp.data['sede_direccion'], 'Calle Derecha 456, Huaral')
        self.assertEqual(resp.data['metodo_pago'], self.metodo_yape.id)
        self.assertEqual(resp.data['metodo_pago_nombre'], 'Yape')

    def test_venta_metodo_pago_por_nombre(self):
        """Verifica que si se envía el nombre del método de pago en string, se resuelva correctamente."""
        payload = {
            'tipo_comprobante': 'Boleta',
            'cliente': self.cliente.id,
            'metodo_pago': 'Efectivo',
            'detalles_write': [
                {
                    'producto': self.producto.id,
                    'lote': self.lote.id,
                    'cantidad_real': 1,
                    'cantidad_flotante': 0,
                    'cantidad_blister': 0
                }
            ]
        }
        resp = self.client.post(reverse('venta-create'), payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['metodo_pago_nombre'], 'Efectivo')





