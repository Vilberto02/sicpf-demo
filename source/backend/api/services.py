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
