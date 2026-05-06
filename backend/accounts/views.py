import re

from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Address, CustomerProfile, ProducerProfile

User = get_user_model()

_PASSWORD_RULES = (
    'Password must be at least 8 characters, contain an uppercase letter, '
    'a lowercase letter, and a number.'
)


def _validate_password(password):
    if len(password) < 8:
        return _PASSWORD_RULES
    if not re.search(r'[A-Z]', password):
        return _PASSWORD_RULES
    if not re.search(r'[a-z]', password):
        return _PASSWORD_RULES
    if not re.search(r'[0-9]', password):
        return _PASSWORD_RULES
    return None


def _token_response(user, status=200):
    refresh = RefreshToken.for_user(user)
    return Response({
        'token': str(refresh.access_token),
        'user': {
            'email': user.email,
            'full_name': user.full_name,
            'role_name': user.role_name,
        }
    }, status=status)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=400)

    rate_key = f'login_fail_{email}'
    attempts = cache.get(rate_key, 0)
    if attempts >= 5:
        return Response(
            {'error': 'Too many failed attempts. Please try again in 15 minutes.'},
            status=429,
        )

    try:
        username = User.objects.get(email=email).username
    except User.DoesNotExist:
        cache.set(rate_key, attempts + 1, timeout=900)
        return Response({'error': 'Invalid credentials.'}, status=401)

    user = authenticate(request, username=username, password=password)
    if user is None:
        cache.set(rate_key, attempts + 1, timeout=900)
        return Response({'error': 'Invalid credentials.'}, status=401)

    cache.delete(rate_key)
    return _token_response(user)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register_customer(request):
    email    = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    full_name     = request.data.get('full_name', '').strip()
    address_line_1 = request.data.get('address_line_1', '').strip()
    city     = request.data.get('city', '').strip()
    postcode = request.data.get('postcode', '').strip()

    if not all([email, password, full_name, address_line_1, city, postcode]):
        return Response({'error': 'Please fill in all required fields.'}, status=400)

    pw_error = _validate_password(password)
    if pw_error:
        return Response({'error': pw_error}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=400)

    address = Address.objects.create(
        line_1=address_line_1,
        line_2=request.data.get('address_line_2') or None,
        city=city,
        postcode=postcode,
    )

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        full_name=full_name,
        phone=request.data.get('phone') or None,
        role_name='CUSTOMER',
    )

    CustomerProfile.objects.create(
        user=user,
        customer_type=request.data.get('customer_type', 'INDIVIDUAL'),
        org_name=request.data.get('org_name') or None,
        address=address,
    )

    return _token_response(user, status=201)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register_producer(request):
    email         = request.data.get('email', '').strip().lower()
    password      = request.data.get('password', '')
    full_name     = request.data.get('full_name', '').strip()
    business_name = request.data.get('business_name', '').strip()
    address_line_1 = request.data.get('address_line_1', '').strip()
    city          = request.data.get('city', '').strip()
    postcode      = request.data.get('postcode', '').strip()

    if not all([email, password, full_name, business_name, address_line_1, city, postcode]):
        return Response({'error': 'Please fill in all required fields.'}, status=400)

    pw_error = _validate_password(password)
    if pw_error:
        return Response({'error': pw_error}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=400)

    address = Address.objects.create(
        line_1=address_line_1,
        line_2=request.data.get('address_line_2') or None,
        city=city,
        postcode=postcode,
    )

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        full_name=full_name,
        phone=request.data.get('phone') or None,
        role_name='PRODUCER',
    )

    from accounts.models import ProducerProfile
    ProducerProfile.objects.create(
        user=user,
        business_name=business_name,
        contact_name=request.data.get('contact_name') or None,
        lead_time_hours=request.data.get('lead_time_hours') or 48,
        address=address,
    )

    return _token_response(user, status=201)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def producer_locations(request):
    producers = ProducerProfile.objects.filter(is_verified=True).select_related('address')
    data = [
        {
            'id': p.id,
            'business_name': p.business_name,
            'postcode': p.address.postcode,
            'city': p.address.city,
            'address': f"{p.address.line_1}, {p.address.city}, {p.address.postcode}",
        }
        for p in producers
    ]
    return Response(data)