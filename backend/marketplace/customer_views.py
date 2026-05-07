from collections import defaultdict
from decimal import Decimal

from accounts.models import Address, CustomerProfile
from django.db import transaction
from django.db.models import F
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from marketplace.models import Order, OrderItem, OrderProducer, Product
from marketplace.serializers import IncomingOrderProducerSerializer


@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def orders(request):
    if request.user.role_name not in ("CUSTOMER", "COMMUNITY_GROUP", "RESTAURANT"):
        return Response(
            {"error": "Only customer accounts can access orders."}, status=403
        )

    # GET: list orders 
    if request.method == "GET":
        try:
            customer_profile = request.user.customer_profile
        except CustomerProfile.DoesNotExist:
            return Response([], status=200)

        orders_qs = (
            Order.objects
            .filter(customer=customer_profile)
            .select_related('delivery_address')
            .prefetch_related(
                'producer_orders__producer',
                'producer_orders__items__product',
            )
            .order_by('-placed_at')
        )

        data = []
        for order in orders_qs:
            addr = order.delivery_address
            producers = []
            for op in order.producer_orders.all():
                items = []
                for item in op.items.all():
                    items.append({
                        'product_id': item.product_id,
                        'product_name': item.product.product_name,
                        'quantity': str(item.quantity),
                        'unit': item.product.product_unit,
                        'unit_price_gbp': str(item.unit_price_gbp),
                        'total_cost': str(item.total_cost),
                        'status': item.status,
                        'is_available': item.product.is_available,
                    })
                producers.append({
                    'producer_name': op.producer.business_name,
                    'status': op.status,
                    'items': items,
                })

            data.append({
                'id': order.id,
                'placed_at': order.placed_at,
                'order_status': order.order_status,
                'total_amount': str(order.total_amount),
                'delivery_address': {
                    'line_1': addr.line_1,
                    'line_2': addr.line_2,
                    'city': addr.city,
                    'postcode': addr.postcode,
                },
                'producers': producers,
            })
        return Response(data, status=200)

    # POST: place a new order
    delivery = request.data.get("delivery", {})
    items = request.data.get("items", [])
    total = request.data.get("total", 0)

    required = ["address1", "city", "postcode"]
    if any(not delivery.get(f, "").strip() for f in required):
        return Response({"error": "Delivery address is incomplete."}, status=400)

    if not items:
        return Response(
            {"error": "Cannot place an order with an empty cart."}, status=400
        )

    try:
        total = Decimal(str(total))
        if total <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({"error": "Invalid order total."}, status=400)

    # Validate all product IDs exist before touching the DB
    product_ids = []
    for item in items:
        try:
            product_ids.append(int(item.get("id") or item.get("product_id")))
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

    # Accumulate total quantity needed per product and check stock
    qty_per_product = defaultdict(Decimal)
    for item in items:
        pid = int(item.get("id") or item.get("product_id"))
        qty_per_product[pid] += Decimal(str(item.get("quantity", 1)))

    for pid, qty_needed in qty_per_product.items():
        product = products_by_id[pid]
        if product.stock_quantity < qty_needed:
            return Response(
                {"error": f"Not enough stock for '{product.product_name}'. "
                          f"Available: {product.stock_quantity}, requested: {qty_needed}"},
                status=400,
            )

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

        # Group items by producer → one OrderProducer per producer
        producer_items = {}
        for item in items:
            product = products_by_id[int(item.get("id") or item.get("product_id"))]
            pid = product.producer_id
            if pid not in producer_items:
                producer_items[pid] = {"producer": product.producer, "items": []}
            producer_items[pid]["items"].append((product, item))

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
                # Decrement stock atomically
                Product.objects.filter(pk=product.pk).update(
                    stock_quantity=F('stock_quantity') - quantity
                )
                product.refresh_from_db()
                product.save()

    return Response(
        {
            "order_id": order.id,
            "status": "PENDING",
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
        return Response(
            {"error": "Only producer accounts can view incoming orders."}, status=403
        )

    order_producers = (
        OrderProducer.objects.filter(producer=producer_profile)
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

    serializer = IncomingOrderProducerSerializer(order_producers, many=True)
    return Response(serializer.data)
