from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from decimal import Decimal
from .models import Categoria, Presentacion, Producto, Lote
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

        # Obtener Token JWT
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'testuser',
            'password': 'testpassword'
        })
        self.token = response.data['access']

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

    def test_create_producto(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        response = self.client.post(reverse('producto-create'), self.producto_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Producto.objects.count(), 1)

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

