# Generated manually to decouple DDL indexing from row updates for PostgreSQL compatibility

from django.db import migrations


def seed_metodos_and_prepare_ventas(apps, schema_editor):
    MetodoPago = apps.get_model('api', 'MetodoPago')
    Venta = apps.get_model('api', 'Venta')
    metodos = [
        {'nombre': 'Efectivo', 'descripcion': 'Pago en efectivo'},
        {'nombre': 'Yape', 'descripcion': 'Billetera digital Yape'},
        {'nombre': 'Plin', 'descripcion': 'Billetera digital Plin'},
        {'nombre': 'Tarjeta', 'descripcion': 'Tarjeta de débito o crédito (POS)'},
        {'nombre': 'Transferencia', 'descripcion': 'Transferencia bancaria directa'},
    ]
    efectivo_obj = None
    for m in metodos:
        obj, _ = MetodoPago.objects.get_or_create(
            nombre=m['nombre'],
            defaults={'descripcion': m['descripcion'], 'is_active': True}
        )
        if m['nombre'] == 'Efectivo':
            efectivo_obj = obj

    if efectivo_obj:
        Venta.objects.filter(metodo_pago__isnull=True).update(metodo_pago=efectivo_obj)


def update_ventas_sede(apps, schema_editor):
    Venta = apps.get_model('api', 'Venta')
    Sede = apps.get_model('api', 'Sede')
    primera_sede = Sede.objects.first()

    ventas_to_update = []
    for venta in Venta.objects.filter(sede__isnull=True).select_related('usuario'):
        if venta.usuario and getattr(venta.usuario, 'sede_id', None):
            venta.sede_id = venta.usuario.sede_id
            ventas_to_update.append(venta)
        elif primera_sede:
            venta.sede_id = primera_sede.id
            ventas_to_update.append(venta)

    if ventas_to_update:
        Venta.objects.bulk_update(ventas_to_update, ['sede'], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_metodopago_venta_sede_alter_negocio_nombre_comercial_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_metodos_and_prepare_ventas, migrations.RunPython.noop),
        migrations.RunPython(update_ventas_sede, migrations.RunPython.noop),
    ]
