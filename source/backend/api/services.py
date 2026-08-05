from .models import InventoryItem, Sale, Alert, Recommendation

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

class InventoryService(BaseService):
    model = InventoryItem

class SaleService(BaseService):
    model = Sale

class AlertService(BaseService):
    model = Alert

class RecommendationService(BaseService):
    model = Recommendation
