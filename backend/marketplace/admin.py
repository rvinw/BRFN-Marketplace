from django.contrib import admin

from .models import (
    Allergen,
    Cart,
    CartItem,
    Category,
    Order,
    OrderItem,
    OrderProducer,
    Product,
    ProductAllergen,
    ProductAvailabilityWindow,
    ProductDeal,
    ProductImage,
)


# ── Inlines ───────────────────────────────────────────────

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ["image_url", "image_sort_order"]


class ProductAllergenInline(admin.TabularInline):
    model = ProductAllergen
    extra = 1


class ProductDealInline(admin.TabularInline):
    model = ProductDeal
    extra = 0
    fields = ["discount_percentage", "expires_at", "is_active", "note"]


class ProductAvailabilityWindowInline(admin.TabularInline):
    model = ProductAvailabilityWindow
    extra = 1
    fields = ["availability_type", "start_month", "end_month"]


# ── Category ──────────────────────────────────────────────

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["category_name", "category_description", "product_count"]
    search_fields = ["category_name"]

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Products"


# ── Product ───────────────────────────────────────────────

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "product_name", "producer", "category", "current_price",
        "product_unit", "organic_status", "is_available", "stock_quantity"
    ]
    list_filter = ["category", "organic_status", "is_available", "product_unit"]
    search_fields = ["product_name", "producer__business_name"]
    list_editable = ["is_available", "current_price"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Basic Info", {
            "fields": ("producer", "category", "product_name", "product_description")
        }),
        ("Pricing & Stock", {
            "fields": ("current_price", "product_unit", "stock_quantity", "product_stock_threshold")
        }),
        ("Status", {
            "fields": ("organic_status", "is_available", "harvest_date", "best_before_date")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    inlines = [
        ProductImageInline,
        ProductAllergenInline,
        ProductDealInline,
        ProductAvailabilityWindowInline,
    ]


# ── Allergen ──────────────────────────────────────────────

@admin.register(Allergen)
class AllergenAdmin(admin.ModelAdmin):
    list_display = ["allergen_name"]
    search_fields = ["allergen_name"]


# ── Product Deal ──────────────────────────────────────────

@admin.register(ProductDeal)
class ProductDealAdmin(admin.ModelAdmin):
    list_display = ["product", "discount_percentage", "expires_at", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["product__product_name"]
    list_editable = ["is_active"]


# ── Orders ────────────────────────────────────────────────

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "quantity", "unit_price_gbp", "total_cost"]


class OrderProducerInline(admin.TabularInline):
    model = OrderProducer
    extra = 0
    readonly_fields = ["producer", "status"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "order_status", "total_amount", "placed_at"]
    list_filter = ["order_status"]
    search_fields = ["customer__user__email"]
    readonly_fields = ["customer", "delivery_address", "placed_at", "total_amount"]
    list_editable = ["order_status"]
    ordering = ["-placed_at"]
    inlines = [OrderProducerInline]


# ── Cart ──────────────────────────────────────────────────

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "created_at"]
    inlines = [CartItemInline]


