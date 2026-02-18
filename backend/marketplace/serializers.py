from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductSerializer(serializers.ModelSerializer):
    producer = serializers.ReadOnlyField(source="producer.username")

    class Meta:
        model = Product
        fields = [
            "id",
            "producer",
            "category",
            "name",
            "description",
            "price",
            "stock_quantity",
            "is_active",
            "created_at",
        ]
