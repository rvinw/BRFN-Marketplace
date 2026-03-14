from accounts.models import ProducerProfile
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# -----------------------------------|
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

    current_price = models.DecimalField(max_digits=10, decimal_places=2)

    product_unit = models.CharField(max_length=10, choices=Unit.choices)

    stock_quantity = models.DecimalField(max_digits=12, decimal_places=3)
    product_stock_threshold = models.DecimalField(
        max_digits=12, decimal_places=3, blank=True, null=True
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
# CART------------------------------|
# -----------------------------------|

# -----------------------------------|
# ORDER
# -----------------------------------|

# -----------------------------------|
# PAYMENTS
# -----------------------------------|
