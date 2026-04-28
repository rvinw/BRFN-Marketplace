from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.models import Address, CustomerProfile
from marketplace.models import Order


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def place_order(request):
    if request.user.role_name not in ('CUSTOMER', 'COMMUNITY_GROUP', 'RESTAURANT'):
        return Response({'error': 'Only customer accounts can place orders.'}, status=403)

    delivery = request.data.get('delivery', {})
    items    = request.data.get('items', [])
    total    = request.data.get('total', 0)

    # Validate delivery address
    required = ['address1', 'city', 'postcode']
    if any(not delivery.get(f, '').strip() for f in required):
        return Response({'error': 'Delivery address is incomplete.'}, status=400)

    if not items:
        return Response({'error': 'Cannot place an order with an empty cart.'}, status=400)

    try:
        total = float(total)
        if total <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({'error': 'Invalid order total.'}, status=400)

    address = Address.objects.create(
        line_1=delivery['address1'].strip(),
        line_2=delivery.get('address2', '').strip() or None,
        city=delivery['city'].strip(),
        postcode=delivery['postcode'].strip(),
    )

    user = request.user
    try:
        customer_profile = user.customer_profile
    except CustomerProfile.DoesNotExist:
        customer_profile = CustomerProfile.objects.create(
            user=user,
            customer_type='INDIVIDUAL',
            address=address,
        )

    order = Order.objects.create(
        customer=customer_profile,
        delivery_address=address,
        order_status='PENDING',
        total_amount=total,
    )

    return Response({'order_id': order.id, 'status': 'PENDING'}, status=201)
