from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum
from .models import (
    Categoria, Producto, Lote, PrediccionML, Alerta, 
    Recomendacion, Cliente, Rol, Usuario, Venta, DetalleVenta
)

class BaseService:
    model = None

    @classmethod
    def get_all(cls):
        return cls.model.objects.all()

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

class ProductoService(BaseService):
    model = Producto

class LoteService(BaseService):
    model = Lote

class PrediccionMLService(BaseService):
    model = PrediccionML

class AlertaService(BaseService):
    model = Alerta

class RecomendacionService(BaseService):
    model = Recomendacion

class ClienteService(BaseService):
    model = Cliente

class RolService(BaseService):
    model = Rol

class UsuarioService(BaseService):
    model = Usuario

class VentaService(BaseService):
    model = Venta

class DetalleVentaService(BaseService):
    model = DetalleVenta


class AlertGenerationService:
    DIAS_HORIZONTE = 15
    STOCK_MINIMO_DEFAULT = 10

    @classmethod
    def generate_all(cls):
        alertas_generadas = []

        for producto in Producto.objects.all():
            cls._delete_old_alerts(producto)

            lotes = producto.lotes.all()
            stock_total_real = sum(l.stock_real for l in lotes)
            stock_total_flotante = sum(l.stock_flotante for l in lotes)

            stock_minimo = cls._get_stock_minimo(producto)

            if stock_total_real <= stock_minimo:
                alerta = cls._crear_alerta_stock(
                    producto, stock_total_real, stock_minimo, 'alto', 'critico'
                )
                if alerta:
                    alertas_generadas.append(alerta)

            elif stock_total_real <= stock_minimo * 1.5:
                alerta = cls._crear_alerta_stock(
                    producto, stock_total_real, stock_minimo, 'medio', 'bajo'
                )
                if alerta:
                    alertas_generadas.append(alerta)

            for lote in lotes:
                dias_vencimiento = (lote.fecha_vencimiento - date.today()).days
                if dias_vencimiento <= 0:
                    alerta = cls._crear_alerta_vencimiento(
                        producto, lote, stock_minimo, 'alto', 'vencido'
                    )
                    if alerta:
                        alertas_generadas.append(alerta)
                elif dias_vencimiento <= cls.DIAS_HORIZONTE:
                    alerta = cls._crear_alerta_vencimiento(
                        producto, lote, stock_minimo, 'medio', 'por vencer'
                    )
                    if alerta:
                        alertas_generadas.append(alerta)

            dias_cobertura = cls._calcular_dias_cobertura(
                stock_total_real, stock_total_flotante, producto
            )
            if dias_cobertura <= cls.DIAS_HORIZONTE:
                nivel = 'alto' if dias_cobertura <= 7 else 'medio'
                alerta = cls._crear_alerta_quiebre(
                    producto, dias_cobertura, stock_minimo, nivel
                )
                if alerta:
                    alertas_generadas.append(alerta)

        return alertas_generadas

    @classmethod
    def _get_stock_minimo(cls, producto):
        return cls.STOCK_MINIMO_DEFAULT

    @classmethod
    def _calcular_dias_cobertura(cls, stock_real, stock_flotante, producto):
        ventas_promedio = cls._get_ventas_promedio(producto, dias=30)

        if ventas_promedio == 0:
            ventas_promedio = 1

        total_unidades = (stock_real * producto.unidades_por_caja) + stock_flotante
        return int(total_unidades / ventas_promedio) if ventas_promedio > 0 else 999

    @classmethod
    def _get_ventas_promedio(cls, producto, dias=30):
        fecha_inicio = date.today() - timedelta(days=dias)

        ventas = DetalleVenta.objects.filter(
            producto=producto,
            venta__fecha__date__gte=fecha_inicio,
            venta__estado='Completado'
        ).aggregate(
            total_real=Sum('cantidad_real'),
            total_flotante=Sum('cantidad_flotante')
        )

        total_real = ventas['total_real'] or 0
        total_flotante = ventas['total_flotante'] or 0

        total_unidades = (total_real * producto.unidades_por_caja) + total_flotante

        return total_unidades / dias if dias > 0 else 0

    @classmethod
    def _crear_alerta_stock(cls, producto, stock_total, stock_minimo, nivel, tipo):
        if tipo == 'critico':
            mensaje = f"Stock critico para {producto.nombre}. Stock actual: {stock_total}, minimo: {stock_minimo}"
        else:
            mensaje = f"Stock bajo para {producto.nombre}. Stock actual: {stock_total}, minimo: {stock_minimo}"

        return Alerta.objects.create(
            producto=producto,
            alerta=mensaje,
            nivel_riesgo=nivel,
            periodo_agotamiento=0,
            stock_minimo=stock_minimo,
            fecha_alerta=date.today(),
            estado='pendiente',
            origen='reglas'
        )

    @classmethod
    def _crear_alerta_vencimiento(cls, producto, lote, stock_minimo, nivel, tipo):
        dias_vencimiento = (lote.fecha_vencimiento - date.today()).days

        if tipo == 'vencido':
            mensaje = f"Producto {producto.nombre} vencido. Lote: {lote.codigo_lote}"
        else:
            mensaje = f"Producto {producto.nombre} vence en {dias_vencimiento} dias. Lote: {lote.codigo_lote}"

        return Alerta.objects.create(
            producto=producto,
            alerta=mensaje,
            nivel_riesgo=nivel,
            periodo_agotamiento=dias_vencimiento,
            stock_minimo=stock_minimo,
            fecha_alerta=date.today(),
            estado='pendiente',
            origen='reglas'
        )

    @classmethod
    def _crear_alerta_quiebre(cls, producto, dias_cobertura, stock_minimo, nivel):
        mensaje = f"Riesgo de quiebre para {producto.nombre} en {dias_cobertura} dias"

        return Alerta.objects.create(
            producto=producto,
            alerta=mensaje,
            nivel_riesgo=nivel,
            periodo_agotamiento=dias_cobertura,
            stock_minimo=stock_minimo,
            fecha_alerta=date.today(),
            estado='pendiente',
            origen='reglas'
        )

    @classmethod
    def _delete_old_alerts(cls, producto):
        Alerta.objects.filter(
            producto=producto,
            estado='pendiente',
            origen='reglas'
        ).delete()
