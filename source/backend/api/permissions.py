# pyrefly: ignore [missing-import]
from rest_framework.permissions import BasePermission, SAFE_METHODS
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import Group


def asegurar_permisos_base(rol):
    """Si el rol no tiene permisos asignados, le otorga un set base segun su nombre:
    - Administrador: todos los permisos sobre los modelos del negocio (app 'api').
    - Otros roles (ej. Vendedor): solo lectura."""
    if rol.permisos.exists():
        return
    # pyrefly: ignore [missing-import]
    from django.contrib.contenttypes.models import ContentType
    # pyrefly: ignore [missing-import]
    from django.contrib.auth.models import Permission

    cts_negocio = ContentType.objects.filter(app_label="api")
    if rol.nombre == "Administrador":
        permisos = Permission.objects.filter(content_type__in=cts_negocio)
    else:
        permisos = Permission.objects.filter(
            content_type__in=cts_negocio, codename__startswith="view"
        )
    rol.permisos.set(permisos)


def get_or_create_rol_group(rol):
    """Cada Rol del negocio se mapea a un Group de Django con los mismos permisos."""
    group, _ = Group.objects.get_or_create(name=rol.nombre)
    asegurar_permisos_base(rol)
    group.permissions.set(rol.permisos.all())
    return group


def sync_user_groups(user, rol):
    """Deja al usuario solo en el Group correspondiente a su rol de negocio."""
    if not user:
        return
    from .models import Rol
    role_names = list(Rol.objects.values_list('nombre', flat=True))
    user.groups.remove(*Group.objects.filter(name__in=role_names))
    if rol:
        user.groups.add(get_or_create_rol_group(rol))


class IsOwnerOrAdmin(BasePermission):
    """Permite el acceso solo al dueño del negocio (superuser de Django)
    o a usuarios con rol 'Administrador'."""

    message = "Solo el dueño del negocio o administradores pueden gestionar usuarios y roles."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        perfil = getattr(request.user, "usuario_perfil", None)
        return bool(perfil and perfil.rol and perfil.rol.nombre == "Administrador")
