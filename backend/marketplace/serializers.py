from rest_framework import serializers

from .models import Category, Product, AddProduct, CommunityPost


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
        
class AddProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddProduct
        fields = '__all__'
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be positive")
        return value
    
    def validate_stock_quantity(self, value):
        if value < 0 or value > 1000:
            raise serializers.ValidationError("Stock must be 0-1000")
        return value
    
    def validate_product_image(self, value):
        if not value.name.endswith('.png'):
            raise serializers.ValidationError("Only PNG files allowed")
        return value
    
class CommunityPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = '__all__'