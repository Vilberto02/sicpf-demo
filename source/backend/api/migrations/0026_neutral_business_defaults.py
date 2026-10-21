from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('api', '0025_alter_detalleventa_options_and_more')]

    # Also update databases that already applied the original migrations.
    # Existing business records intentionally retain their configured values.
    operations = [
        migrations.AlterField(
            model_name='negocio', name=name,
            field=models.CharField(blank=True, default='', max_length=length, **extra),
        )
        for name, length, extra in [
            ('razon_social', 200, {}),
            ('ruc', 11, {'help_text': 'RUC de 11 dígitos'}),
            ('direccion', 255, {}),
            ('departamento', 100, {}),
            ('provincia', 100, {}),
            ('distrito', 100, {}),
            ('url_consulta', 255, {'help_text': 'URL para consultar comprobantes'}),
        ]
    ] + [
        migrations.AlterField(
            model_name='negocio', name='mensaje_pie',
            field=models.TextField(default='¡GRACIAS POR SU COMPRA!', help_text='Mensaje de agradecimiento y políticas al pie del comprobante'),
        ),
        migrations.AlterField(
            model_name='negocio', name='leyenda_software',
            field=models.CharField(default='Generado por SICPF', max_length=150, help_text='Crédito de software al pie del comprobante'),
        ),
    ]
