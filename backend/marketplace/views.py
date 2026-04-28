from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import CommunityPost, Product
from .serializers import CommunityPostSerializer, ProductSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only product listing used by the shop."""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Product.objects
            .select_related('category', 'producer')
            .prefetch_related('images')
            .order_by('-created_at')
        )


class CommunityPostViewSet(viewsets.ModelViewSet):
    queryset = CommunityPost.objects.all()
    serializer_class = CommunityPostSerializer


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok'})
