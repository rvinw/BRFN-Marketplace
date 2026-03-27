from rest_framework import serializers
from .models import Allergen, Category, Product, ProductAvailabilityWindow, ProductDeal, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "category_name", "category_description"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image_url", "image_sort_order"]


class ProductDealSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDeal
        fields = ["id", "discount_percentage", "expires_at", "note", "is_active"]


class ProductAvailabilityWindowSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAvailabilityWindow
        fields = ["id", "availability_type", "start_month", "end_month"]


class AddProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    deals = ProductDealSerializer(many=True, read_only=True)
    availability_windows = ProductAvailabilityWindowSerializer(many=True, read_only=True)
    category_name = serializers.ReadOnlyField(source="category.category_name")
    producer_name = serializers.ReadOnlyField(source="producer.business_name")

    class Meta:
        model = Product
        fields = [
            "id", "product_name", "product_description", "current_price",
            "product_unit", "stock_quantity", "organic_status",
            "is_available", "harvest_date", "best_before_date",
            "created_at", "updated_at",
            "category", "category_name",
            "producer_name", "images", "deals", "availability_windows",
        ]
        read_only_fields = ["created_at", "updated_at"]

class CommunityPostSerializer(serializers.ModelSerializer):
    pass