from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from marketplace.models import Product, StandingOrder
from accounts.models import CustomerProfile


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def standing_orders(request):
    try:
        customer = request.user.customer_profile
    except CustomerProfile.DoesNotExist:
        return Response({'error': 'Only customers can manage standing orders.'}, status=403)

    if request.method == 'GET':
        orders = StandingOrder.objects.filter(customer=customer, is_active=True).select_related('product')
        data = [
            {
                'id': o.id,
                'product_id': o.product.id,
                'product_name': o.product.product_name,
                'product_unit': o.product.product_unit,
                'price': str(o.product.current_price),
                'quantity': o.quantity,
                'created_at': o.created_at,
                'delivery_day': o.delivery_day,
                'next_delivery': o.next_delivery(),
            }
            for o in orders
        ]
        return Response(data)

    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)
    delivery_day = request.data.get('delivery_day', 0)

    if not product_id:
        return Response({'error': 'product_id is required.'}, status=400)

    if delivery_day not in range(7):
        return Response({'error': 'delivery_day must be between 0 (Monday) and 6 (Sunday).'}, status=400)

    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    standing_order, created = StandingOrder.objects.update_or_create(
        customer=customer,
        product=product,
        defaults={'quantity': quantity, 'is_active': True, 'delivery_day': delivery_day},
    )

    return Response({
        'id': standing_order.id,
        'product_name': product.product_name,
        'quantity': standing_order.quantity,
        'delivery_day': standing_order.delivery_day,
        'next_delivery': standing_order.next_delivery(),
        'message': 'Standing order set successfully.',
    }, status=201 if created else 200)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def cancel_standing_order(request, order_id):
    try:
        customer = request.user.customer_profile
    except CustomerProfile.DoesNotExist:
        return Response({'error': 'Only customers can manage standing orders.'}, status=403)

    try:
        order = StandingOrder.objects.get(pk=order_id, customer=customer)
    except StandingOrder.DoesNotExist:
        return Response({'error': 'Standing order not found.'}, status=404)

    order.is_active = False
    order.save()
    return Response({'message': 'Standing order cancelled.'})


@api_view(['PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_delivery_day(request, order_id):
    try:
        customer = request.user.customer_profile
    except CustomerProfile.DoesNotExist:
        return Response({'error': 'Only customers can manage standing orders.'}, status=403)

    try:
        order = StandingOrder.objects.get(pk=order_id, customer=customer)
    except StandingOrder.DoesNotExist:
        return Response({'error': 'Standing order not found.'}, status=404)

    delivery_day = request.data.get('delivery_day')

    if delivery_day is None or int(delivery_day) not in range(7):
        return Response({'error': 'delivery_day must be between 0 (Monday) and 6 (Sunday).'}, status=400)

    order.delivery_day = int(delivery_day)
    order.save()

    return Response({
        'id': order.id,
        'delivery_day': order.delivery_day,
        'next_delivery': order.next_delivery(),
    })