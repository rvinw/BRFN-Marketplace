from accounts.models import Address, CustomerProfile, ProducerProfile
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# ----------------------------------|
# CATALOGUE-------------------------|
# ----------------------------------|


class Category(models.Model):
    category_name = models.CharField(max_length=100, unique=True)
    category_description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.category_name


class Product(models.Model):
    class Unit(models.TextChoices):
        EACH = "EACH", "Each"
        PACK = "PACK", "Pack"
        BUNCH = "BUNCH", "Bunch"
        BOX = "BOX", "Box"
        DOZEN = "DOZEN", "Dozen"
        G = "G", "Gram (g)"
        KG = "KG", "Kilogram (kg)"
        ML = "ML", "Millilitre (ml)"
        L = "L", "Litre (l)"

    class OrganicStatus(models.TextChoices):
        ORGANIC = "ORGANIC", "Organic"
        NON_ORGANIC = "NON_ORGANIC", "Non-Organic"

    producer = models.ForeignKey(
        ProducerProfile, on_delete=models.PROTECT, related_name="products"
    )
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )

    product_name = models.CharField(max_length=255)
    product_description = models.TextField()

    current_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    product_unit = models.CharField(max_length=10, choices=Unit.choices)

    stock_quantity = models.DecimalField(
        max_digits=12, decimal_places=3, validators=[MinValueValidator(0)]
    )
    product_stock_threshold = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
    )

    harvest_date = models.DateField(blank=True, null=True)
    best_before_date = models.DateField(blank=True, null=True)

    organic_status = models.CharField(max_length=20, choices=OrganicStatus.choices)

    is_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image_url = models.TextField()
    image_sort_order = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"Image for {self.product.product_name}"


class Allergen(models.Model):
    allergen_name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.allergen_name


class ProductAllergen(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    allergen = models.ForeignKey(Allergen, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "allergen"], name="unique_product_allergen"
            )
        ]

    def __str__(self):
        return f"{self.product.product_name} - {self.allergen.allergen_name}"


class ProductAvailabilityWindow(models.Model):
    class AvailabilityType(models.TextChoices):
        SEASONAL = "SEASONAL", "Seasonal"
        YEAR_ROUND = "YEAR_ROUND", "Year Round"

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="availability_windows"
    )
    availability_type = models.CharField(
        max_length=20, choices=AvailabilityType.choices
    )

    start_month = models.PositiveSmallIntegerField(
        blank=True, null=True, validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    end_month = models.PositiveSmallIntegerField(
        blank=True, null=True, validators=[MinValueValidator(1), MaxValueValidator(12)]
    )

    def clean(self):
        if self.availability_type == self.AvailabilityType.YEAR_ROUND:
            if self.start_month is not None or self.end_month is not None:
                raise ValidationError("YEAR_ROUND must not have start/end month.")
        if self.availability_type == self.AvailabilityType.SEASONAL:
            if self.start_month is None or self.end_month is None:
                raise ValidationError("SEASONAL must include start and end month.")

    def save(self, *args, **kwargs):
        if kwargs.pop("clean", True):
            self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        if self.availability_type == self.AvailabilityType.YEAR_ROUND:
            return f"{self.product.product_name} (Year round)"
        return f"{self.product.product_name} ({self.start_month}-{self.end_month})"


class ProductDeal(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="deals")
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    expires_at = models.DateTimeField()
    note = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.product.product_name} - {self.discount_percentage}%"


# -----------------------------------|
# CART-------------------------------|
# -----------------------------------|


class Cart(models.Model):
    customer = models.ForeignKey(
        CustomerProfile,
        on_delete=models.CASCADE,
        related_name="carts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart #{self.id} (customer={self.customer_id})"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="cart_items",
    )
    product_cart_quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product"],
                name="unique_cart_product",
            )
        ]

    def __str__(self):
        return f"{self.product_id} x {self.product_cart_quantity}"


# -----------------------------------|
# ORDER------------------------------|
# -----------------------------------|


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        CANCELLED = "CANCELLED", "Cancelled"

    customer = models.ForeignKey(
        CustomerProfile, on_delete=models.PROTECT, related_name="orders"
    )
    delivery_address = models.ForeignKey(
        Address, on_delete=models.PROTECT, related_name="orders"
    )

    placed_at = models.DateTimeField(auto_now_add=True)
    order_status = models.CharField(max_length=20, choices=OrderStatus.choices)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"Order #{self.id}"


class OrderProducer(models.Model):
    class ProducerStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        READY = "READY", "Ready"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="producer_orders"
    )
    producer = models.ForeignKey(
        ProducerProfile, on_delete=models.PROTECT, related_name="order_splits"
    )
    status = models.CharField(max_length=20, choices=ProducerStatus.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["order", "producer"],
                name="unique_order_producer",
            )
        ]

    def __str__(self):
        return f"Order #{self.order_id} - Producer {self.producer_id}"


class OrderItem(models.Model):
    order_producer = models.ForeignKey(
        OrderProducer, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="order_items"
    )

    quantity = models.DecimalField(
        max_digits=12, decimal_places=3, validators=[MinValueValidator(0.001)]
    )
    unit_price_gbp = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product.product_name} x {self.quantity}"


class OrderStatusHistory(models.Model):
    order_producer = models.ForeignKey(
        OrderProducer, on_delete=models.CASCADE, related_name="status_history"
    )

    old_status = models.CharField(
        max_length=20,
        choices=OrderProducer.ProducerStatus.choices,
        blank=True,
        null=True,
    )
    new_status = models.CharField(
        max_length=20, choices=OrderProducer.ProducerStatus.choices
    )
    note = models.TextField(blank=True, null=True)

    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="order_status_changes",
    )

    def __str__(self):
        return f"{self.order_producer_id}: {self.old_status} -> {self.new_status}"


# -----------------------------------|
# PAYMENTS---------------------------|
# -----------------------------------|
class AddProduct(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_amount = models.CharField(max_length=50)
    availability = models.BooleanField(default=True)
    stock_quantity = models.IntegerField(default=0)
    allergy_info = models.CharField(max_length=500, blank= True)
    harvest_date = models.DateTimeField(null=True, blank=True)
    product_image = models.ImageField(upload_to='products/', null=True, blank=True)
    
    def __str__(self):
        return self.name
    
class CommunityPost(models.Model):
    POST_TYPE_CHOICES = [
        ('Farm Story', 'Farm Story'),
        ('Recipe', 'Recipe'),
    ]
    
    post_type = models.CharField(max_length=50, choices=POST_TYPE_CHOICES)
    is_public = models.BooleanField(default=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title