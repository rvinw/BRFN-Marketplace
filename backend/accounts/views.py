from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework_simplejwt.tokens import RefreshToken
import json


@csrf_exempt
@require_POST
def login_view(request):
    data = json.loads(request.body)
    email = data.get('email')
    password = data.get('password')
    user = authenticate(request, username=email, password=password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'token': str(refresh.access_token),
            'user': {
                'email': user.email,
                'full_name': user.full_name,
                'role_name': user.role_name,
            }
        })
    return JsonResponse({'error': 'Invalid credentials'}, status=401)
