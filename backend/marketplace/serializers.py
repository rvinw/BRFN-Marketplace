from rest_framework import serializers
from .models import Category, Product, CommunityPost, AddProduct, OrderItem, OrderProducer


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'category_description', 'product_count']


class ProductSerializer(serializers.ModelSerializer):
    # Alias field names so the frontend doesn't need to change
    name         = serializers.CharField(source='product_name')
    description  = serializers.CharField(source='product_description')
    price        = serializers.DecimalField(source='current_price', max_digits=10, decimal_places=2)
    unit_amount  = serializers.CharField(source='product_unit')
    availability = serializers.BooleanField(source='is_available')
    category     = serializers.CharField(source='category.category_name', read_only=True)
    category_id  = serializers.PrimaryKeyRelatedField(
        source='category', queryset=Category.objects.all(), write_only=True
    )
    producer_name = serializers.CharField(source='producer.business_name', read_only=True)
    producer_id   = serializers.PrimaryKeyRelatedField(
        source='producer', read_only=True
    )
    image = serializers.SerializerMethodField()

    def get_image(self, obj):
        first = obj.images.first()
        return first.image_url if first else None

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'unit_amount',
            'availability', 'category', 'category_id',
            'stock_quantity', 'organic_status',
            'image', 'producer_name', 'producer_id',
            'harvest_date', 'created_at',
        ]
        read_only_fields = ['created_at']


class CommunityPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ['id', 'post_type', 'is_public', 'title', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


# Kept for any existing references — no longer used by web-facing endpoints
class AddProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddProduct
        fields = [
            'id', 'name', 'category', 'description', 'price',
            'unit_amount', 'availability', 'stock_quantity',
            'allergy_info', 'harvest_date', 'product_image',
        ]



class IncomingOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.product_name")

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "quantity",
            "unit_price_gbp",
            "total_cost",
            "status",
        ]


class IncomingOrderProducerSerializer(serializers.ModelSerializer):
    order_id = serializers.ReadOnlyField(source="order.id")
    customer_email = serializers.ReadOnlyField(source="order.customer.user.email")
    delivery_postcode = serializers.ReadOnlyField(source="order.delivery_address.postcode")
    placed_at = serializers.ReadOnlyField(source="order.placed_at")
    items = IncomingOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = OrderProducer
        fields = [
            "id",
            "order_id",
            "status",
            "customer_email",
            "delivery_postcode",
            "placed_at",
            "items",
        ]