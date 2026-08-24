from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from decimal import Decimal
from .models import Categoria, Presentacion, Producto
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
        self.assertEqual(len(response.data), 1)
