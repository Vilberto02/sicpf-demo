import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sicpf_core.settings')
django.setup()

from api.models import Venta
from api.serializers import VentaSerializer
from rest_framework.test import APIRequestFactory
from api.views import VentaUpdateView

v = Venta.objects.last()
print(f"Before: {v.estado}")

factory = APIRequestFactory()
request = factory.patch(f'/api/ventas/{v.id}/update/', {'estado': 'Cancelado'}, format='json')

# Mock authentication
from django.contrib.auth.models import User
user = User.objects.first()
from rest_framework.request import Request
request.user = user

view = VentaUpdateView.as_view()
response = view(request, pk=v.id)
print(f"Status code: {response.status_code}")
print(f"Response data: {response.data}")
