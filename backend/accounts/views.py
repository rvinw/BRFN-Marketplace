from rest_framework import generics, permissions
from .serializers import (
    CustomerRegisterSerializer,
    ProducerRegisterSerializer,
    UserSerializer,
)


class CustomerRegisterView(generics.CreateAPIView):
    serializer_class = CustomerRegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProducerRegisterView(generics.CreateAPIView):
    serializer_class = ProducerRegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user