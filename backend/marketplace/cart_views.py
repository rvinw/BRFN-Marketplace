from accounts.models import Address, CustomerProfile
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from marketplace.models import Cart, CartItem, Product


def _get_or_create_cart(user):
    """Get or create a Cart for the given user's CustomerProfile."""
    try:
        profile = user.customer_profile
    except CustomerProfile.DoesNotExist:
        # Auto-create a minimal profile so customers who registered without
        # one can still use the cart
        address = Address.objects.create(
            line_1="Not set", city="Not set", postcode="Not set"
        )
        profile = CustomerProfile.objects.create(
            user=user,
            customer_type="INDIVIDUAL",
            address=address,
        )
    cart, _ = Cart.objects.get_or_create(customer=profile)
    return cart


def _serialize_cart(cart):
    items = cart.items.select_related(
        "product__category", "product__producer"
    ).prefetch_related("product__images")
    return {
        "id": cart.id,
        "items": [
            {
                "id": item.product.id,  # product ID — matches frontend cart item id
                "cart_item_id": item.id,  # DB row id for this CartItem
                "name": item.product.product_name,
                "price": str(item.product.current_price),
                "unit": item.product.product_unit,
                "category": item.product.category.category_name,
                "image": (
                    item.product.images.first().image_url
                    if item.product.images.exists()
                    else None
                ),
                "quantity": item.product_cart_quantity,
            }
            for item in items
        ],
    }


@api_view(["GET", "DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def cart_detail(request):
    """GET — return current cart. DELETE — clear all items."""
    if request.user.role_name not in ("CUSTOMER", "COMMUNITY_GROUP", "RESTAURANT"):
        return Response({"error": "Only customers can have a cart."}, status=403)

    cart = _get_or_create_cart(request.user)

    if request.method == "DELETE":
        cart.items.all().delete()
        return Response({"id": cart.id, "items": []})

    return Response(_serialize_cart(cart))


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def cart_add_item(request):
    """Add a product to the cart, or increment its quantity if already present."""
    if request.user.role_name not in ("CUSTOMER", "COMMUNITY_GROUP", "RESTAURANT"):
        return Response({"error": "Only customers can have a cart."}, status=403)

    product_id = request.data.get("product_id")
    quantity = int(request.data.get("quantity", 1))

    if not product_id or quantity < 1:
        return Response({"error": "product_id and quantity are required."}, status=400)

    try:
        product = Product.objects.get(id=product_id, is_available=True)
    except Product.DoesNotExist:
        return Response({"error": "Product not found or unavailable."}, status=404)

    cart = _get_or_create_cart(request.user)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={"product_cart_quantity": quantity},
    )
    if not created:
        item.product_cart_quantity += quantity
        item.save()

    return Response(_serialize_cart(cart), status=201 if created else 200)


@api_view(["PATCH", "DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def cart_item_detail(request, product_id):
    """PATCH — set quantity. DELETE — remove item."""
    if request.user.role_name not in ("CUSTOMER", "COMMUNITY_GROUP", "RESTAURANT"):
        return Response({"error": "Only customers can have a cart."}, status=403)

    cart = _get_or_create_cart(request.user)

    try:
        item = CartItem.objects.get(cart=cart, product_id=product_id)
    except CartItem.DoesNotExist:
        return Response({"error": "Item not in cart."}, status=404)

    if request.method == "DELETE":
        item.delete()
        return Response(_serialize_cart(cart))

    # PATCH — update quantity
    quantity = int(request.data.get("quantity", 1))
    if quantity <= 0:
        item.delete()
    else:
        item.product_cart_quantity = quantity
        item.save()

    return Response(_serialize_cart(cart))
