from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from decimal import Decimal
from django.utils import timezone
from django.db.models import F, Sum

from marketplace.models import Category, Product, OrderItem, PayoutRequest, StockNotification
from marketplace.serializers import StockNotificationSerializer


UNIT_MAP = {
    'kg': 'KG', 'kilogram': 'KG', 'kilograms': 'KG',
    'g': 'G', 'gram': 'G', 'grams': 'G',
    'l': 'L', 'litre': 'L', 'liter': 'L', 'litres': 'L',
    'ml': 'ML', 'millilitre': 'ML', 'milliliter': 'ML',
    'each': 'EACH', 'item': 'EACH',
    'pack': 'PACK', 'packet': 'PACK',
    'bunch': 'BUNCH',
    'box': 'BOX',
    'dozen': 'DOZEN',
}


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def producer_add_product(request):
    if request.user.role_name not in ('PRODUCER', 'ADMIN'):
        return Response({'error': 'Only producer or admin accounts can add products.'}, status=403)

    try:
        producer = request.user.producer_profile
    except Exception:
        producer = None

    if request.method == 'GET':
        if not producer:
            return Response([])
        products = Product.objects.filter(producer=producer).select_related('category').order_by('-created_at')
        data = [{
            'id': p.id,
            'name': p.product_name,
            'description': p.product_description,
            'category': p.category.category_name if p.category else '',
            'price': str(p.current_price),
            'unit_amount': p.product_unit,
            'stock_quantity': str(p.stock_quantity),
            'is_available': p.is_available,
            'organic_status': p.organic_status,
            'harvest_date': p.harvest_date.isoformat() if p.harvest_date else None,
        } for p in products]
        return Response(data)

    try:
        producer = request.user.producer_profile
    except Exception:
        from accounts.models import Address, ProducerProfile
        if request.user.role_name == 'PRODUCER':
            # Auto-create a ProducerProfile for producer-role users who don't have one yet
            address = Address.objects.create(
                line_1='Not set', city='Not set', postcode='Not set'
            )
            producer = ProducerProfile.objects.create(
                user=request.user,
                business_name=request.user.full_name or request.user.email,
                address=address,
            )
        elif request.user.role_name == 'ADMIN':
            producer = ProducerProfile.objects.first()
            if not producer:
                return Response({'error': 'No producer profiles exist yet. Create one via Django admin first.'}, status=400)
        else:
            return Response({'error': 'No producer profile found for this account.'}, status=400)

    name = request.data.get('name', '').strip()
    if not name:
        return Response({'error': 'Product name is required.'}, status=400)

    price = request.data.get('price')
    if not price:
        return Response({'error': 'Price is required.'}, status=400)

    category_name = request.data.get('category', 'Other').strip()
    category, _ = Category.objects.get_or_create(category_name=category_name)

    unit_input = request.data.get('unit_amount', '').lower().strip()
    product_unit = UNIT_MAP.get(unit_input, 'EACH')

    availability = str(request.data.get('availability', 'true')).lower() in ('true', '1', 'yes')

    try:
        product = Product.objects.create(
            product_name=name,
            product_description=request.data.get('description', ''),
            current_price=price,
            product_unit=product_unit,
            stock_quantity=request.data.get('stock_quantity', 0),
            product_stock_threshold=request.data.get('product_stock_threshold') or None,
            organic_status=request.data.get('organic_status', 'NON_ORGANIC'),
            is_available=availability,
            category=category,
            producer=producer,
            harvest_date=(request.data.get('harvest_date') or '')[:10] or None,
        )
        image_url = request.data.get('image_url', '').strip()
        if image_url:
            from marketplace.models import ProductImage
            ProductImage.objects.create(product=product, image_url=image_url)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

    return Response({
        'id': product.id,
        'name': product.product_name,
        'category': product.category.category_name,
        'price': str(product.current_price),
    }, status=201)


@api_view(['PATCH', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def producer_product_detail(request, product_id):
    if request.user.role_name not in ('PRODUCER', 'ADMIN'):
        return Response({'error': 'Only producer accounts can manage products.'}, status=403)

    try:
        product = Product.objects.select_related('category', 'producer').get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    try:
        producer = request.user.producer_profile
        if product.producer != producer:
            return Response({'error': 'You do not own this product.'}, status=403)
    except Exception:
        pass

    if request.method == 'DELETE':
        product.delete()
        return Response(status=204)

    field_map = {
        'price': 'current_price',
        'stock_quantity': 'stock_quantity',
        'is_available': 'is_available',
        'description': 'product_description',
        'harvest_date': 'harvest_date',
        'organic_status': 'organic_status',
    }
    for frontend_key, model_field in field_map.items():
        if frontend_key in request.data:
            setattr(product, model_field, request.data[frontend_key])
    product.save()

    return Response({
        'id': product.id,
        'name': product.product_name,
        'description': product.product_description,
        'category': product.category.category_name if product.category else '',
        'price': str(product.current_price),
        'unit_amount': product.product_unit,
        'stock_quantity': str(product.stock_quantity),
        'is_available': product.is_available,
        'organic_status': product.organic_status,
        'harvest_date': product.harvest_date.isoformat() if product.harvest_date else None,
    })


@api_view(["PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def cancel_order_item(request, item_id):

    if request.user.role_name != "PRODUCER":
        return Response(
            {"error": "Only producers can cancel items."},
            status=403
        )

    try:
        item = OrderItem.objects.select_related(
            "order_producer__producer__user"
        ).get(id=item_id)

    except OrderItem.DoesNotExist:
        return Response(
            {"error": "Order item not found."},
            status=404
        )

    producer_user = item.order_producer.producer.user

    if producer_user != request.user:
        return Response(
            {"error": "You do not own this order item."},
            status=403
        )

    item.status = "CANCELLED"
    item.save()

    # Restore stock when item is cancelled
    Product.objects.filter(pk=item.product_id).update(
        stock_quantity=F('stock_quantity') + item.quantity
    )

    return Response({
        "message": "Order item cancelled successfully.",
        "item_id": item.id,
        "status": item.status,
    })

@api_view(["PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_order_item_status(request, item_id):
    if request.user.role_name != "PRODUCER":
        return Response({"error": "Only producers can update items."}, status=403)

    new_status = request.data.get("status")

    allowed_statuses = ["CONFIRMED", "READY", "DELIVERED", "CANCELLED"]

    if new_status not in allowed_statuses:
        return Response({"error": "Invalid status."}, status=400)

    try:
        item = OrderItem.objects.select_related(
            "order_producer__producer__user"
        ).get(id=item_id)
    except OrderItem.DoesNotExist:
        return Response({"error": "Order item not found."}, status=404)

    if item.order_producer.producer.user != request.user:
        return Response({"error": "You do not own this item."}, status=403)

    if item.status in ["DELIVERED", "CANCELLED"]:
        return Response(
            {"error": "Delivered or cancelled items cannot be changed."},
            status=400,
        )

    valid_transitions = {
        "PENDING": ["CONFIRMED", "CANCELLED"],
        "CONFIRMED": ["READY", "CANCELLED"],
        "READY": ["DELIVERED"],
    }

    if new_status not in valid_transitions.get(item.status, []):
        return Response(
            {"error": f"Cannot change from {item.status} to {new_status}."},
            status=400,
        )

    item.status = new_status
    item.save()

    # Restore stock if cancelled
    if new_status == "CANCELLED":
        Product.objects.filter(pk=item.product_id).update(
            stock_quantity=F('stock_quantity') + item.quantity
        )

    order_producer = item.order_producer
    statuses = list(order_producer.items.values_list("status", flat=True))

    if all(status == "DELIVERED" for status in statuses):
        order_producer.status = "DELIVERED"
    elif all(status == "CANCELLED" for status in statuses):
        order_producer.status = "CANCELLED"
    elif any(status == "READY" for status in statuses):
        order_producer.status = "READY"
    elif any(status in ["CONFIRMED", "DELIVERED"] for status in statuses):
        order_producer.status = "CONFIRMED"
    else:
        order_producer.status = "PENDING"

    order_producer.save()

    # Auto-update parent Order status when all producers have finished
    order = order_producer.order
    all_op_statuses = list(order.producer_orders.values_list("status", flat=True))

    if all(s == "DELIVERED" for s in all_op_statuses):
        order.order_status = "PAID"
        order.save()
    elif all(s == "CANCELLED" for s in all_op_statuses):
        order.order_status = "CANCELLED"
        order.save()

    # Auto-create or update the weekly payout request when this producer's
    # portion is fully delivered
    if order_producer.status == "DELIVERED":
        producer = order_producer.producer
        order_date = order.placed_at.date()
        week_start = order_date - timezone.timedelta(days=order_date.weekday())
        week_end = week_start + timezone.timedelta(days=6)

        gross = OrderItem.objects.filter(
            order_producer__producer=producer,
            status="DELIVERED",
            order_producer__order__placed_at__date__gte=week_start,
            order_producer__order__placed_at__date__lte=week_end,
        ).aggregate(total=Sum("total_cost"))["total"] or Decimal("0.00")

        commission = (gross * Decimal("0.05")).quantize(Decimal("0.01"))
        net = gross - commission

        pr, created = PayoutRequest.objects.get_or_create(
            producer=producer,
            week_start=week_start,
            week_end=week_end,
            defaults={
                "gross_amount": gross,
                "commission_amount": commission,
                "net_amount": net,
                "status": "PENDING",
            },
        )
        if not created and pr.status == "PENDING":
            pr.gross_amount = gross
            pr.commission_amount = commission
            pr.net_amount = net
            pr.save()

    return Response({
        "message": "Item status updated successfully.",
        "item_id": item.id,
        "status": item.status,
    })

@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def weekly_payout(request):
    if request.user.role_name != "PRODUCER":
        return Response({"error": "Only producers can access payout."}, status=403)

    try:
        producer = request.user.producer_profile
    except Exception:
        return Response({"error": "Producer profile not found."}, status=404)

    today = timezone.now().date()
    week_start = today - timezone.timedelta(days=today.weekday())
    week_end = week_start + timezone.timedelta(days=6)

    delivered_items = OrderItem.objects.filter(
        order_producer__producer=producer,
        status="DELIVERED",
        order_producer__order__placed_at__date__gte=week_start,
        order_producer__order__placed_at__date__lte=week_end,
    )

    gross_amount = delivered_items.aggregate(total=Sum("total_cost"))["total"] or Decimal("0.00")
    commission_amount = gross_amount * Decimal("0.05")
    net_amount = gross_amount - commission_amount

    existing_request = PayoutRequest.objects.filter(
        producer=producer,
        week_start=week_start,
        week_end=week_end,
    ).first()

    if request.method == "POST":
        if existing_request:
            return Response(
                {"error": "Payout already requested for this week."},
                status=400,
            )

        payout = PayoutRequest.objects.create(
            producer=producer,
            week_start=week_start,
            week_end=week_end,
            gross_amount=gross_amount,
            commission_amount=commission_amount,
            net_amount=net_amount,
            status="PENDING",
        )

        return Response(
            {
                "message": "Payout requested successfully.",
                "status": payout.status,
                "requested_at": payout.requested_at,
            },
            status=201,
        )

    return Response(
        {
            "week_start": week_start,
            "week_end": week_end,
            "gross_amount": gross_amount,
            "commission_amount": commission_amount,
            "net_amount": net_amount,
            "request_status": existing_request.status if existing_request else "NOT_REQUESTED",
            "requested_at": existing_request.requested_at if existing_request else None,
            "items": [
                {
                    "id": item.id,
                    "product_name": item.product.product_name,
                    "quantity": item.quantity,
                    "total_cost": item.total_cost,
                }
                for item in delivered_items.select_related("product")
            ],
        }
    )


@api_view(["PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_order_item_availability(request, item_id):
    if request.user.role_name != "PRODUCER":
        return Response({"error": "Only producers can update items."}, status=403)

    try:
        item = OrderItem.objects.select_related(
            "order_producer__producer__user"
        ).get(id=item_id)
    except OrderItem.DoesNotExist:
        return Response({"error": "Order item not found."}, status=404)

    if item.order_producer.producer.user != request.user:
        return Response({"error": "You do not own this item."}, status=403)

    fulfilled_quantity = request.data.get("fulfilled_quantity")
    availability_note = request.data.get("availability_note", "")

    if fulfilled_quantity is not None:
        try:
            fulfilled_quantity = Decimal(str(fulfilled_quantity))
        except:
            return Response({"error": "Invalid fulfilled quantity."}, status=400)

        if fulfilled_quantity < 0:
            return Response({"error": "Fulfilled quantity cannot be negative."}, status=400)

        if fulfilled_quantity > item.quantity:
            return Response(
                {"error": "Fulfilled quantity cannot be greater than ordered quantity."},
                status=400,
            )

        item.fulfilled_quantity = fulfilled_quantity

        if fulfilled_quantity == 0:
            item.status = "CANCELLED"
            item.availability_note = availability_note or "Item unavailable."
        elif fulfilled_quantity < item.quantity:
            item.availability_note = availability_note or "Partial quantity available."
        else:
            item.availability_note = availability_note

    item.save()

    return Response({
        "message": "Item availability updated successfully.",
        "item_id": item.id,
        "ordered_quantity": item.quantity,
        "fulfilled_quantity": item.fulfilled_quantity,
        "availability_note": item.availability_note,
        "status": item.status,
    })


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def producer_set_availability(request, product_id):
    if request.user.role_name not in ('PRODUCER', 'ADMIN'):
        return Response({'error': 'Only producers can set availability.'}, status=403)
    try:
        product = Product.objects.get(pk=product_id, producer=request.user.producer_profile)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    from marketplace.models import ProductAvailabilityWindow
    availability_type = request.data.get('availability_type')
    start_month = request.data.get('start_month') or None
    end_month = request.data.get('end_month') or None

    if availability_type not in ('SEASONAL', 'YEAR_ROUND'):
        return Response({'error': 'Invalid availability type.'}, status=400)

    ProductAvailabilityWindow.objects.filter(product=product).delete()
    ProductAvailabilityWindow.objects.create(
        product=product,
        availability_type=availability_type,
        start_month=start_month if availability_type == 'SEASONAL' else None,
        end_month=end_month if availability_type == 'SEASONAL' else None,
    )
    return Response({'status': 'availability updated'}, status=200)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def producer_set_deal(request, product_id):
    if request.user.role_name not in ('PRODUCER', 'ADMIN'):
        return Response({'error': 'Only producers can set deals.'}, status=403)
    try:
        product = Product.objects.get(pk=product_id, producer=request.user.producer_profile)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    from marketplace.models import ProductDeal
    discount = request.data.get('discount_percentage')
    expires_at = request.data.get('expires_at')

    product.deals.filter(is_active=True).update(is_active=False)

    if not discount or float(discount) == 0:
        return Response({'status': 'deal removed'}, status=200)
    deal = ProductDeal.objects.create(
        product=product,
        discount_percentage=discount,
        expires_at=expires_at,
        is_active=True,
    )
    return Response({'id': deal.id, 'discount_percentage': str(deal.discount_percentage), 'expires_at': deal.expires_at}, status=201)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def producer_notifications(request):
    try:
        producer = request.user.producer_profile
    except Exception:
        return Response({'error': 'No producer profile found.'}, status=403)
    notifications = StockNotification.objects.filter(producer=producer).order_by('-created_at')
    serializer = StockNotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        producer = request.user.producer_profile
    except Exception:
        return Response({'error': 'No producer profile found.'}, status=403)
    try:
        notification = StockNotification.objects.get(pk=notification_id, producer=producer)
    except StockNotification.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)
    notification.is_read = True
    notification.save()
    return Response({'status': 'marked as read'})