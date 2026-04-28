from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import ProducerProfile

User = get_user_model()


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role_name == 'ADMIN'
        )


class AdminUserListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        users = User.objects.all().order_by('id')
        data = [{
            'id': u.id,
            'email': u.email,
            'full_name': u.full_name,
            'phone': u.phone,
            'role_name': u.role_name,
            'is_active': u.is_active,
            'date_joined': u.date_joined,
        } for u in users]
        return Response(data)

    def post(self, request):
        data = request.data
        try:
            user = User.objects.create_user(
                email=data['email'],
                username=data['email'],
                password=data['password'],
                full_name=data.get('full_name', ''),
                role_name=data.get('role_name', 'CUSTOMER'),
                phone=data.get('phone', '') or '',
            )
            return Response({
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'role_name': user.role_name,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminUserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def patch(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        for field in ['full_name', 'phone', 'role_name', 'is_active']:
            if field in request.data:
                setattr(user, field, request.data[field])

        if request.data.get('password'):
            user.set_password(request.data['password'])

        user.save()
        return Response({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'phone': user.phone,
            'role_name': user.role_name,
            'is_active': user.is_active,
            'date_joined': user.date_joined,
        })

    def delete(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        if user.pk == request.user.pk:
            return Response(
                {'error': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProducerListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        producers = ProducerProfile.objects.select_related('user', 'address').all()
        data = [{
            'id': p.id,
            'business_name': p.business_name,
            'contact_name': p.contact_name,
            'user_email': p.user.email,
            'user_id': p.user.id,
            'lead_time_hours': p.lead_time_hours,
            'is_verified': p.is_verified,
            'address': str(p.address) if p.address else None,
        } for p in producers]
        return Response(data)


class AdminProducerVerifyView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            producer = ProducerProfile.objects.get(pk=pk)
        except ProducerProfile.DoesNotExist:
            return Response({'error': 'Producer not found'}, status=status.HTTP_404_NOT_FOUND)
        producer.is_verified = not producer.is_verified
        producer.save()
        return Response({'id': producer.id, 'is_verified': producer.is_verified})
