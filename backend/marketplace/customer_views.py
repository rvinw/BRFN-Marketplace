from decimal import Decimal

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.models import Address, CustomerProfile
from marketplace.models import Order, Product, OrderProducer, OrderItem
from marketplace.serializers import IncomingOrderProducerSerializer


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def place_order(request):
    if request.user.role_name not in ("CUSTOMER", "COMMUNITY_GROUP", "RESTAURANT"):
        return Response({"error": "Only customer accounts can place orders."}, status=403)

    delivery = request.data.get("delivery", {})
    items = request.data.get("items", [])
    total = request.data.get("total", 0)

    required = ["address1", "city", "postcode"]
    if any(not delivery.get(f, "").strip() for f in required):
        return Response({"error": "Delivery address is incomplete."}, status=400)

    if not items:
        return Response({"error": "Cannot place an order with an empty cart."}, status=400)

    try:
        total = Decimal(str(total))
        if total <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({"error": "Invalid order total."}, status=400)

    address = Address.objects.create(
        line_1=delivery["address1"].strip(),
        line_2=delivery.get("address2", "").strip() or None,
        city=delivery["city"].strip(),
        postcode=delivery["postcode"].strip(),
    )

    user = request.user

    try:
        customer_profile = user.customer_profile
    except CustomerProfile.DoesNotExist:
        customer_profile = CustomerProfile.objects.create(
            user=user,
            customer_type="INDIVIDUAL",
            address=address,
        )

    order = Order.objects.create(
        customer=customer_profile,
        delivery_address=address,
        order_status="PENDING",
        total_amount=total,
    )

    for item in items:
        product_id = item.get("product_id") or item.get("id")
        quantity = Decimal(str(item.get("quantity", 1)))

        if quantity <= 0:
            return Response({"error": "Invalid item quantity."}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": f"Product with id {product_id} does not exist."},
                status=400,
            )

        order_producer, _ = OrderProducer.objects.get_or_create(
            order=order,
            producer=product.producer,
            defaults={"status": "PENDING"},
        )

        unit_price = product.current_price
        total_cost = unit_price * quantity

        OrderItem.objects.create(
            order_producer=order_producer,
            product=product,
            quantity=quantity,
            unit_price_gbp=unit_price,
            total_cost=total_cost,
        )

    return Response(
        {
            "order_id": order.id,
            "status": order.order_status,
            "message": "Order placed successfully.",
        },
        status=201,
    )


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def producer_incoming_orders(request):
    try:
        producer_profile = request.user.producer_profile
    except Exception:
        return Response({"error": "Only producer accounts can view incoming orders."}, status=403)

    orders = (
        OrderProducer.objects
        .filter(producer=producer_profile)
        .select_related(
            "order",
            "order__customer",
            "order__customer__user",
            "order__delivery_address",
            "producer",
        )
        .prefetch_related("items__product")
        .order_by("-order__placed_at")
    )

    serializer = IncomingOrderProducerSerializer(orders, many=True)
    return Response(serializer.data)