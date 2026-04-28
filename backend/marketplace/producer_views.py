from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from marketplace.models import Category, Product


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


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def producer_add_product(request):
    if request.user.role_name not in ('PRODUCER', 'ADMIN'):
        return Response({'error': 'Only producer or admin accounts can add products.'}, status=403)

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
            organic_status='NON_ORGANIC',
            is_available=availability,
            category=category,
            producer=producer,
            harvest_date=(request.data.get('harvest_date') or '')[:10] or None,
        )
    except Exception as e:
        return Response({'error': str(e)}, status=400)

    return Response({
        'id': product.id,
        'name': product.product_name,
        'category': product.category.category_name,
        'price': str(product.current_price),
    }, status=201)
