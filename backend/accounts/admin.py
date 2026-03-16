from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Address, CustomerProfile, ProducerProfile, User


# ── Inlines ──────────────────────────────────────────────

class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    extra = 0
    can_delete = False


class ProducerProfileInline(admin.StackedInline):
    model = ProducerProfile
    extra = 0
    can_delete = False


# ── User ─────────────────────────────────────────────────

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "full_name", "role_name", "is_active", "is_staff", "date_joined"]
    list_filter = ["role_name", "is_active", "is_staff"]
    search_fields = ["email", "full_name"]
    ordering = ["-date_joined"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "phone", "role_name")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "role_name", "password1", "password2"),
        }),
    )

    inlines = [CustomerProfileInline, ProducerProfileInline]


# ── Address ───────────────────────────────────────────────

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["line_1", "city", "postcode"]
    search_fields = ["line_1", "city", "postcode"]


# ── Customer Profile ──────────────────────────────────────

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "customer_type", "org_name"]
    list_filter = ["customer_type"]
    search_fields = ["user__email", "org_name"]


# ── Producer Profile ──────────────────────────────────────

@admin.register(ProducerProfile)
class ProducerProfileAdmin(admin.ModelAdmin):
    list_display = ["business_name", "user", "is_verified", "lead_time_hours"]
    list_filter = ["is_verified"]
    search_fields = ["business_name", "user__email"]
    actions = ["verify_producers"]

    @admin.action(description="Mark selected producers as verified")
    def verify_producers(self, request, queryset):
        queryset.update(is_verified=True)