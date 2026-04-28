from rest_framework import serializers
from .models import Allergen, Category, Product, ProductAvailabilityWindow, ProductDeal, ProductImage, CommunityPost, AddProduct


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
    class Meta:
        model = AddProduct
        fields = [
            'id', 'name', 'category', 'description', 'price',
            'unit_amount', 'availability', 'stock_quantity',
            'allergy_info', 'harvest_date', 'product_image'
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate_stock_quantity(self, value):
        if value < 0 or value > 1000:
            raise serializers.ValidationError("Stock must be between 0 and 1000.")
        return value

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Product name must be at least 2 characters.")
        return value

class CommunityPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ['id', 'post_type', 'is_public', 'title', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']