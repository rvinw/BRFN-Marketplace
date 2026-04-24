from rest_framework import serializers

from .models import Category, Product
from .models import Category, Product, Order, OrderItem


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


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    customer_username = serializers.ReadOnlyField(source="customer.username")
    producer_username = serializers.ReadOnlyField(source="producer.username")
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "customer_username",
            "producer",
            "producer_username",
            "status",
            "ready_for_delivery",
            "total_price",
            "created_at",
            "items",
        ]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status", "ready_for_delivery"]
