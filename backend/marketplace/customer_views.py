from decimal import Decimal

from accounts.models import Address, CustomerProfile
from django.db import transaction
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from marketplace.models import Order, OrderItem, OrderProducer, Product


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def place_order(request):
    if request.user.role_name not in ("CUSTOMER", "COMMUNITY_GROUP", "RESTAURANT"):
        return Response(
            {"error": "Only customer accounts can place orders."}, status=403
        )

    delivery = request.data.get("delivery", {})
    items = request.data.get("items", [])
    total = request.data.get("total", 0)

    # Validate delivery address
    required = ["address1", "city", "postcode"]
    if any(not delivery.get(f, "").strip() for f in required):
        return Response({"error": "Delivery address is incomplete."}, status=400)

    if not items:
        return Response(
            {"error": "Cannot place an order with an empty cart."}, status=400
        )

    try:
        total = float(total)
        if total <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({"error": "Invalid order total."}, status=400)

    # Validate all product IDs exist before touching the DB
    product_ids = []
    for item in items:
        try:
            product_ids.append(int(item["id"]))
        except (KeyError, TypeError, ValueError):
            return Response({"error": "Invalid item in cart."}, status=400)

    products_by_id = {
        p.id: p
        for p in Product.objects.select_related("producer").filter(id__in=product_ids)
    }
    missing = set(product_ids) - set(products_by_id.keys())
    if missing:
        return Response(
            {"error": f"Some products no longer exist: {missing}"}, status=400
        )

    # Wrap everything in a transaction so partial failures roll back cleanly
    with transaction.atomic():
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

        # Group items by producer so we can create one OrderProducer per producer
        producer_items = {}
        for item in items:
            product = products_by_id[int(item["id"])]
            pid = product.producer_id
            if pid not in producer_items:
                producer_items[pid] = {"producer": product.producer, "items": []}
            producer_items[pid]["items"].append((product, item))

        # Create OrderProducer + OrderItem records
        for pid, group in producer_items.items():
            order_producer = OrderProducer.objects.create(
                order=order,
                producer=group["producer"],
                status="PENDING",
            )
            for product, item in group["items"]:
                quantity = Decimal(str(item.get("quantity", 1)))
                unit_price = Decimal(str(item.get("price", product.current_price)))
                OrderItem.objects.create(
                    order_producer=order_producer,
                    product=product,
                    quantity=quantity,
                    unit_price_gbp=unit_price,
                    total_cost=unit_price * quantity,
                )

    return Response({"order_id": order.id, "status": "PENDING"}, status=201)
