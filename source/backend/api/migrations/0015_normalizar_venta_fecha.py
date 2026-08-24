from django.db import migrations


def normalizar_fechas(apps, schema_editor):
    """Convierte fechas almacenadas sin componente horario ('YYYY-MM-DD')
    en datetimes validos ('YYYY-MM-DD 00:00:00') para que las funciones
    de fecha de SQLite (lookups __date, TruncMonth) no fallen."""
    Venta = apps.get_model('api', 'Venta')
    db_alias = schema_editor.connection.alias
    columns = [
        col.name for col in schema_editor.connection.introspection.get_table_description(
            schema_editor.connection.cursor(), Venta._meta.db_table
        )
    ]
    if 'fecha' not in columns:
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            f"SELECT id FROM {Venta._meta.db_table} "
            f"WHERE LENGTH(fecha) = 10"
        )
        ids = [row[0] for row in cursor.fetchall()]
        for pk in ids:
            cursor.execute(
                f"UPDATE {Venta._meta.db_table} "
                f"SET fecha = fecha || ' 00:00:00' WHERE id = %s",
                [pk],
            )


def revertir(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_stock_minimo_dual'),
    ]

    operations = [
        migrations.RunPython(normalizar_fechas, revertir),
    ]
