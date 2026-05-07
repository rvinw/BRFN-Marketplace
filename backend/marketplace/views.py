from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import CommunityPost, Product
from .serializers import CommunityPostSerializer, ProductSerializer
from marketplace.ai_services.recommender_db import get_db_recommendations
import tempfile
import os

from rest_framework import status
from marketplace.ai_services.model_service import classify_produce

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only product listing used by the shop."""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = (
            Product.objects
            .select_related('category', 'producer')
            .prefetch_related('images')
            .filter(is_available=True)
            .order_by('-created_at')
        )

        search = self.request.query_params.get('search', '').strip()
        category = self.request.query_params.get('category', '').strip()

        if search:
            qs = qs.filter(
                Q(product_name__icontains=search) |
                Q(product_description__icontains=search) |
                Q(producer__business_name__icontains=search)
            )

        if category:
            qs = qs.filter(category__category_name__icontains=category)

        return qs


class CommunityPostViewSet(viewsets.ModelViewSet):
    queryset = CommunityPost.objects.all()
    serializer_class = CommunityPostSerializer


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok'})

@api_view(["GET"])
def recommendations(request, user_id):
    """
    Task 1 — database-based quick reorder recommendations.
    """
    recs = get_db_recommendations(user_id=user_id, top_n=3)

    return Response({
        "user_id": user_id,
        "recommendations": recs,
    })

@api_view(["POST"])
def freshness_check(request):
    """
    Task 2 + Task 4:
    Classify uploaded produce image as fresh/rotten and return Grad-CAM XAI.
    """
    image = request.FILES.get("image")

    if not image:
        return Response(
            {"error": "No image uploaded"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    tmp_path = None

    try:
        suffix = os.path.splitext(image.name)[1] or ".jpg"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in image.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        result = classify_produce(tmp_path)

        return Response(result)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)