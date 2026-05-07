from rest_framework import serializers

from .models import (
    AddProduct,
    Category,
    CommunityPost,
    OrderItem,
    OrderProducer,
    Product,
    ProductDeal,
    Review,
    StockNotification,
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source="products.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "category_name", "category_description", "product_count"]


class ProductDealSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDeal
        fields = ["id", "discount_percentage", "expires_at", "is_active", "note"]


class ProductSerializer(serializers.ModelSerializer):
    # Alias field names so the frontend doesn't need to change
    name = serializers.CharField(source="product_name")
    description = serializers.CharField(source="product_description")
    price = serializers.DecimalField(
        source="current_price", max_digits=10, decimal_places=2
    )
    unit_amount = serializers.CharField(source="product_unit")
    availability = serializers.BooleanField(source="is_available")
    category = serializers.CharField(source="category.category_name", read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True
    )
    producer_name = serializers.CharField(
        source="producer.business_name", read_only=True
    )
    producer_id = serializers.PrimaryKeyRelatedField(source="producer", read_only=True)
    image = serializers.SerializerMethodField()
    producer_name = serializers.ReadOnlyField(source="producer.business_name")
    stock_status = serializers.SerializerMethodField()
    deals = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    allergens = serializers.SerializerMethodField()
    availability_windows = serializers.SerializerMethodField()

    def get_allergens(self, obj):
        return list(obj.productallergen_set.select_related('allergen').values_list('allergen__allergen_name', flat=True))

    def get_availability_windows(self, obj):
        return [{'availability_type': w.availability_type, 'start_month': w.start_month, 'end_month': w.end_month}
                for w in obj.availability_windows.all()]

    def get_deals(self, obj):
        from django.utils import timezone
        from django.db.models import Q
        active_deals = obj.deals.filter(is_active=True).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )
        return ProductDealSerializer(active_deals, many=True).data

    def get_discounted_price(self, obj):
        from django.utils import timezone
        from django.db.models import Q
        active_deal = obj.deals.filter(is_active=True).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).first()
        if active_deal:
            discount = active_deal.discount_percentage / 100
            return round(float(obj.current_price) * (1 - float(discount)), 2)
        return None

    def get_image(self, obj):
        first = obj.images.first()
        return first.image_url if first else None
    
    def get_stock_status(self, obj):
        if obj.stock_quantity <= 0 or not obj.is_available:
            return "SOLD_OUT"
        return "IN_STOCK"

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "unit_amount",
            "availability",
            "category",
            "category_id",
            "stock_quantity",
            "organic_status",
            "image",
            "producer_name",
            "producer_id",
            "harvest_date",
            "created_at",
            "is_available",
            "stock_status",
            "deals",
            "discounted_price",
            "allergens",
            "availability_windows",
        ]
        read_only_fields = ["created_at"]


class CommunityPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ["id", "post_type", "is_public", "title", "description", "created_at"]
        read_only_fields = ["id", "created_at"]


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    def get_customer_name(self, obj):
        return obj.customer.full_name or obj.customer.email

    class Meta:
        model = Review
        fields = ["id", "rating", "comment", "customer_name", "created_at"]
        read_only_fields = ["id", "customer_name", "created_at"]


# Kept for any existing references — no longer used by web-facing endpoints
class AddProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddProduct
        fields = [
            "id",
            "name",
            "category",
            "description",
            "price",
            "unit_amount",
            "availability",
            "stock_quantity",
            "allergy_info",
            "harvest_date",
            "product_image",
        ]


class IncomingOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.product_name")

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "quantity",
            "fulfilled_quantity",
            "availability_note",
            "unit_price_gbp",
            "total_cost",
            "status",
        ]


class StockNotificationSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.product_name")

    class Meta:
        model = StockNotification
        fields = ["id", "product_name", "message", "is_read", "created_at"]


class IncomingOrderProducerSerializer(serializers.ModelSerializer):
    order_id = serializers.ReadOnlyField(source="order.id")
    customer_email = serializers.ReadOnlyField(source="order.customer.user.email")
    delivery_postcode = serializers.ReadOnlyField(
        source="order.delivery_address.postcode"
    )
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
