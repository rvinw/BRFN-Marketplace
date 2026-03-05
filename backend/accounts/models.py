from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models

# USERS


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        PRODUCER = "PRODUCER", "Producer"
        COMMUNITY_GROUP = "COMMUNITY_GROUP", "Community Group"
        RESTAURANT = "RESTAURANT", "Restaurant"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True)

    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=30, blank=True, null=True)

    role_name = models.CharField(
        max_length=30,
        choices=Role.choices,
    )

    def __str__(self) -> str:
        return self.email


class Address(models.Model):
    line_1 = models.CharField(max_length=255)
    line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    postcode = models.CharField(max_length=20)

    def __str__(self) -> str:
        return f"{self.line_1}, {self.city}, {self.postcode}"


class CustomerProfile(models.Model):
    class CustomerType(models.TextChoices):
        INDIVIDUAL = "INDIVIDUAL", "Individual"
        COMMUNITY_GROUP = "COMMUNITY_GROUP", "Community Group"
        RESTAURANT = "RESTAURANT", "Restaurant"

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="customer_profile"
    )
    customer_type = models.CharField(max_length=30, choices=CustomerType.choices)
    org_name = models.CharField(max_length=255, blank=True, null=True)
    address = models.ForeignKey(
        Address, on_delete=models.PROTECT, related_name="customer_profiles"
    )

    def __str__(self) -> str:
        return f"CustomerProfile({self.user.email})"


class ProducerProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="producer_profile"
    )
    business_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    address = models.ForeignKey(
        Address, on_delete=models.PROTECT, related_name="producer_profiles"
    )
    lead_time_hours = models.PositiveIntegerField(
        default=48, validators=[MinValueValidator(0)]
    )
    is_verified = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"ProducerProfile({self.business_name})"
