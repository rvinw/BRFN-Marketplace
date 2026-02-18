from rest_framework import permissions, viewsets

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = (
        Product.objects.select_related("category", "producer")
        .all()
        .order_by("-created_at")
    )
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # For now, set producer to the logged-in user if authenticated.
        # Later we'll restrict this to "PRODUCER" role.
        user = self.request.user if self.request.user.is_authenticated else None
        if user is None:
            raise permissions.PermissionDenied("Login required to create products.")
        serializer.save(producer=user)
