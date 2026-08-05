from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import InventoryItem
from .services import InventoryService

class InventoryServiceTest(TestCase):
    def setUp(self):
        self.item_data = {
            "codigo": "PROD-001",
            "nombre": "Paracetamol",
            "stock_flotante": 10,
            "stock_real": 15,
            "lote": "L123",
            "vencimiento": "2025-12-31",
            "status": "Activo",
            "categoria": "Medicamento"
        }

    def test_create_item(self):
        item = InventoryService.create(self.item_data)
        self.assertEqual(item.codigo, "PROD-001")
        self.assertEqual(InventoryItem.objects.count(), 1)

    def test_get_all(self):
        InventoryService.create(self.item_data)
        items = InventoryService.get_all()
        self.assertEqual(len(items), 1)

class InventoryAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        
        # Get JWT Token
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'testuser',
            'password': 'testpassword'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.item_data = {
            "codigo": "PROD-002",
            "nombre": "Ibuprofeno",
            "stock_flotante": 5,
            "stock_real": 10,
            "lote": "L456",
            "vencimiento": "2024-12-31",
            "status": "Activo",
            "categoria": "Medicamento"
        }

    def test_list_inventory_unauthorized(self):
        self.client.credentials() # clear token
        response = self.client.get(reverse('inventory-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_inventory(self):
        response = self.client.post(reverse('inventory-create'), self.item_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(InventoryItem.objects.count(), 1)

    def test_list_inventory(self):
        InventoryService.create(self.item_data)
        response = self.client.get(reverse('inventory-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
