from datetime import date, datetime, time, timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from .models import (
    Categoria, Presentacion, Producto, Lote, PrediccionML, Alerta,
    Recomendacion, Cliente, Rol, Usuario, Venta, DetalleVenta, Sede,
    DIAS_HORIZONTE_VENCIMIENTO
)

class BaseService:
    model = None

    @classmethod
    def get_queryset(cls):
        return cls.model.objects.all()

    @classmethod
    def get_all(cls):
        return cls.get_queryset()

    @classmethod
    def get_by_id(cls, pk):
        return cls.model.objects.get(pk=pk)

    @classmethod
    def create(cls, data):
        return cls.model.objects.create(**data)

    @classmethod
    def update(cls, pk, data):
        instance = cls.get_by_id(pk)
        for key, value in data.items():
            setattr(instance, key, value)
        instance.save()
        return instance

    @classmethod
    def delete(cls, pk):
        instance = cls.get_by_id(pk)
        instance.delete()

class CategoriaService(BaseService):
    model = Categoria

class PresentacionService(BaseService):
    model = Presentacion

class ProductoService(BaseService):
    model = Producto

    @classmethod
    def get_queryset(cls):
        return cls.model.objects.select_related('categoria', 'presentacion').prefetch_related('lotes')

class LoteService(BaseService):
    model = Lote

    @classmethod
    def get_queryset(cls):
        return cls.model.objects.select_related(
            'producto', 'producto__categoria', 'producto__presentacion'
        )

class PrediccionMLService(BaseService):
    model = PrediccionML

class AlertaService(BaseService):
    model = Alerta

    @classmethod
    def get_queryset(cls):
        return cls.model.objects.select_related(
            'producto', 'producto__categoria', 'producto__presentacion', 'prediccion'
        )

class RecomendacionService(BaseService):
    model = Recomendacion

class ClienteService(BaseService):
    model = Cliente

class SedeService(BaseService):
    model = Sede

class RolService(BaseService):
    model = Rol

class UsuarioService(BaseService):
    model = Usuario

    @classmethod
    def get_queryset(cls):
        return cls.model.objects.select_related('user', 'rol', 'sede')

class VentaService(BaseService):
    model = Venta

    @classmethod
    def get_queryset(cls):
        return cls.model.objects.select_related('cliente', 'usuario', 'usuario__user').prefetch_related('detalles', 'detalles__producto')

class DetalleVentaService(BaseService):
    model = DetalleVenta


class AlertGenerationService:
    DIAS_HORIZONTE = DIAS_HORIZONTE_VENCIMIENTO

    @classmethod
    def generate_all(cls):
        alertas_generadas = []

        for producto in Producto.objects.select_related('presentacion').prefetch_related('lotes').all():
            cls._delete_old_alerts(producto)

            lotes = list(producto.lotes.all())
            lotes_vigentes = [l for l in lotes if l.fecha_vencimiento >= date.today()]
            stock_total_real = sum(l.stock_real for l in lotes)
            stock_total_flotante = sum(l.stock_flotante for l in lotes)
            total_unidades = cls._total_unidades(stock_total_real, stock_total_flotante, producto)

            min_real = producto.stock_minimo_real
            min_flotante = producto.stock_minimo_flotante
            dias_cobertura = cls._calcular_dias_cobertura(
                stock_total_real, stock_total_flotante, producto
            )

            incumple_critico = (
                stock_total_real <= min_real or
                stock_total_flotante <= min_flotante
            )
            incumple_bajo = (
                stock_total_real <= min_real * 1.5 or
                stock_total_flotante <= min_flotante * 1.5
            )

            if incumple_critico:
                alerta = cls._crear_alerta_stock(
                    producto, stock_total_real, stock_total_flotante, total_unidades,
                    dias_cobertura, min_real, min_flotante, 'alto', 'critico'
                )
                if alerta:
                    alertas_generadas.append(alerta)

            elif incumple_bajo:
                alerta = cls._crear_alerta_stock(
                    producto, stock_total_real, stock_total_flotante, total_unidades,
                    dias_cobertura, min_real, min_flotante, 'medio', 'bajo'
                )
                if alerta:
                    alertas_generadas.append(alerta)

            for lote in lotes:
                dias_vencimiento = (lote.fecha_vencimiento - date.today()).days
                if dias_vencimiento <= 0:
                    alerta = cls._crear_alerta_vencimiento(
                        producto, lote, stock_total_real, stock_total_flotante,
                        total_unidades, dias_cobertura, min_real, min_flotante,
                        'alto', 'vencido'
                    )
                    if alerta:
                        alertas_generadas.append(alerta)
                elif dias_vencimiento <= cls.DIAS_HORIZONTE:
                    alerta = cls._crear_alerta_vencimiento(
                        producto, lote, stock_total_real, stock_total_flotante,
                        total_unidades, dias_cobertura, min_real, min_flotante,
                        'medio', 'por vencer'
                    )
                    if alerta:
                        alertas_generadas.append(alerta)

            if dias_cobertura <= cls.DIAS_HORIZONTE and lotes_vigentes:
                nivel = 'alto' if dias_cobertura <= 7 else 'medio'
                alerta = cls._crear_alerta_quiebre(
                    producto, stock_total_real, stock_total_flotante, total_unidades,
                    dias_cobertura, min_real, min_flotante, nivel
                )
                if alerta:
                    alertas_generadas.append(alerta)

        return alertas_generadas

    @classmethod
    def _unidades_equivalentes(cls, producto):
        return max(
            producto.unidades_por_caja,
            producto.blisters_por_caja * producto.unidades_por_blister
        )

    @classmethod
    def _total_unidades(cls, stock_real, stock_flotante, producto):
        return (stock_real * cls._unidades_equivalentes(producto)) + stock_flotante

    @classmethod
    def _calcular_dias_cobertura(cls, stock_real, stock_flotante, producto):
        ventas_promedio = cls._get_ventas_promedio(producto, dias=30)
        total_unidades = cls._total_unidades(stock_real, stock_flotante, producto)
        if ventas_promedio == 0:
            return 999
        return int(total_unidades / ventas_promedio)

    @classmethod
    def _get_ventas_promedio(cls, producto, dias=30):
        fecha_inicio = timezone.make_aware(
            datetime.combine(date.today() - timedelta(days=dias), time.min)
        )
        ventas = DetalleVenta.objects.filter(
            producto=producto,
            venta__fecha__gte=fecha_inicio,
            venta__estado='Completado'
        ).aggregate(
            total_real=Sum('cantidad_real'),
            total_flotante=Sum('cantidad_flotante'),
            total_blister=Sum('cantidad_blister')
        )
        total_real = ventas['total_real'] or 0
        total_flotante = ventas['total_flotante'] or 0
        total_blister = ventas['total_blister'] or 0
        total_unidades = (
            (total_real * cls._unidades_equivalentes(producto)) +
            (total_blister * producto.unidades_por_blister) +
            total_flotante
        )
        return total_unidades / dias if dias > 0 else 0

    @classmethod
    def _crear_alerta_stock(cls, producto, stock_total, stock_flotante, total_unidades,
                            dias_cobertura, min_real, min_flotante, nivel, tipo):
        incumplidas = []
        if stock_total <= min_real:
            incumplidas.append(f"cajas ({stock_total} <= {min_real})")
        if stock_flotante <= min_flotante:
            incumplidas.append(f"unidades sueltas ({stock_flotante} <= {min_flotante})")
        etiqueta = "Stock critico" if tipo == 'critico' else "Stock bajo"
        mensaje = (
            f"{etiqueta} para {producto.nombre}. "
            f"Stock actual: {stock_total} cajas / {stock_flotante} unidades. "
            f"Minimo definido: {min_real} cajas / {min_flotante} unidades. "
            f"Incumple: {', '.join(incumplidas)}"
        )
        return Alerta.objects.create(
            producto=producto,
            alerta=mensaje,
            nivel_riesgo=nivel,
            periodo_agotamiento=dias_cobertura,
            stock_minimo=min_real,
            stock_minimo_flotante=min_flotante,
            fecha_alerta=date.today(),
            estado='pendiente',
            origen='reglas',
            tipo=f'stock_{tipo}'
        )

    @classmethod
    def _crear_alerta_vencimiento(cls, producto, lote, stock_total, stock_flotante,
                                  total_unidades, dias_cobertura, min_real, min_flotante,
                                  nivel, tipo):
        dias_vencimiento = (lote.fecha_vencimiento - date.today()).days
        if tipo == 'vencido':
            mensaje = f"Producto {producto.nombre} vencido. Lote: {lote.codigo_lote}"
        else:
            mensaje = f"Producto {producto.nombre} vence en {dias_vencimiento} dias. Lote: {lote.codigo_lote}"
        return Alerta.objects.create(
            producto=producto,
            alerta=mensaje,
            nivel_riesgo=nivel,
            periodo_agotamiento=dias_cobertura,
            stock_minimo=min_real,
            stock_minimo_flotante=min_flotante,
            fecha_alerta=date.today(),
            estado='pendiente',
            origen='reglas',
            tipo='vencimiento'
        )

    @classmethod
    def _crear_alerta_quiebre(cls, producto, stock_total, stock_flotante, total_unidades,
                              dias_cobertura, min_real, min_flotante, nivel):
        mensaje = f"Riesgo de quiebre para {producto.nombre} en {dias_cobertura} dias"
        return Alerta.objects.create(
            producto=producto,
            alerta=mensaje,
            nivel_riesgo=nivel,
            periodo_agotamiento=dias_cobertura,
            stock_minimo=min_real,
            stock_minimo_flotante=min_flotante,
            fecha_alerta=date.today(),
            estado='pendiente',
            origen='reglas',
            tipo='quiebre'
        )

    @classmethod
    def _delete_old_alerts(cls, producto):
        Alerta.objects.filter(
            producto=producto,
            estado='pendiente',
            origen='reglas'
        ).delete()
