import threading
import logging
from .models import RegistroAuditoria

logger = logging.getLogger('sicpf.security')
_thread_locals = threading.local()

def get_current_request():
    return getattr(_thread_locals, 'request', None)

def get_current_user():
    request = get_current_request()
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    return None

def get_client_ip(request=None):
    if not request:
        request = get_current_request()
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            response = self.get_response(request)

            # Si la respuesta es 403 Forbidden, registrar acceso denegado
            if response.status_code == 403:
                user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
                ip = get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
                path = request.path
                method = request.method
                
                try:
                    RegistroAuditoria.objects.create(
                        usuario=user,
                        accion='ACCESO_DENEGADO',
                        tabla_afectada='HTTP_SECURITY',
                        registro_id=f"{method} {path}",
                        detalles={
                            'path': path,
                            'method': method,
                            'status_code': 403
                        },
                        ip_origen=ip,
                        user_agent=user_agent
                    )
                    logger.warning(f"Acceso denegado (403) a {method} {path} por usuario={user} ip={ip}")
                except Exception as e:
                    logger.error(f"Error al registrar auditoria 403: {e}")

            return response
        finally:
            _thread_locals.request = None
