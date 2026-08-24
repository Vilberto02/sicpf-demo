from django.db import migrations


def copiar_datos_a_user(apps, schema_editor):
    """Mueve nombre/apellido/email del perfil hacia el User de Django
    (fuente de verdad) antes de eliminar las columnas duplicadas."""
    Usuario = apps.get_model('api', 'Usuario')
    User = apps.get_model('auth', 'User')
    for perfil in Usuario.objects.select_related('user').all():
        user = perfil.user
        if not user:
            continue
        cambios = False
        if perfil.nombre and user.first_name != perfil.nombre:
            user.first_name = perfil.nombre
            cambios = True
        if perfil.apellido and user.last_name != perfil.apellido:
            user.last_name = perfil.apellido
            cambios = True
        if perfil.email and user.email != perfil.email:
            user.email = perfil.email
            cambios = True
        if cambios:
            user.save()


def sincronizar_grupos_de_roles(apps, schema_editor):
    """Crea un Group por Rol (con sus permisos) y asigna cada usuario a su grupo."""
    Rol = apps.get_model('api', 'Rol')
    Usuario = apps.get_model('api', 'Usuario')
    Group = apps.get_model('auth', 'Group')

    grupos = {}
    for rol in Rol.objects.all():
        group, _ = Group.objects.get_or_create(name=rol.nombre)
        group.permissions.set(rol.permisos.all())
        grupos[rol.pk] = group

    for perfil in Usuario.objects.select_related('user', 'rol').all():
        if not perfil.user_id:
            continue
        grupos_a_quitar = Group.objects.filter(name__in=list(Rol.objects.values_list('nombre', flat=True)))
        perfil.user.groups.remove(*grupos_a_quitar)
        if perfil.rol_id and perfil.rol_id in grupos:
            perfil.user.groups.add(grupos[perfil.rol_id])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_normalizar_venta_fecha'),
    ]

    operations = [
        migrations.RunPython(copiar_datos_a_user, migrations.RunPython.noop),
        migrations.RemoveField(model_name='usuario', name='nombre'),
        migrations.RemoveField(model_name='usuario', name='apellido'),
        migrations.RemoveField(model_name='usuario', name='email'),
        migrations.RunPython(sincronizar_grupos_de_roles, migrations.RunPython.noop),
    ]
