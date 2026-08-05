# pyrefly: ignore [missing-import]
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    # nombre de la app en el panel de administracion
    verbose_name = 'API'
    
