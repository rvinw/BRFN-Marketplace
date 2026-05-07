from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
import tempfile
import os

from .models import Allergen, CommunityPost, Product, ProductAllergen
from .serializers import CommunityPostSerializer, ProductSerializer
from marketplace.ai_services.recommender_db import get_db_recommendations
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
        organic = self.request.query_params.get('organic', '').strip()

        if search:
            qs = qs.filter(
                Q(product_name__icontains=search) |
                Q(product_description__icontains=search) |
                Q(producer__business_name__icontains=search)
            )

        if organic == 'true':
            qs = qs.filter(organic_status='ORGANIC')

        if category:
            if category.lower() == 'seasonal':
                qs = qs.filter(availability_windows__availability_type='SEASONAL').distinct()
            else:
                qs = qs.filter(category__category_name__icontains=category)

        return qs


class CommunityPostViewSet(viewsets.ModelViewSet):
    queryset = CommunityPost.objects.all()
    serializer_class = CommunityPostSerializer


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok'})


@api_view(['GET'])
def allergen_list(request):
    allergens = Allergen.objects.all().values_list('id', 'allergen_name')
    return Response([{'id': a[0], 'name': a[1]} for a in allergens])


@api_view(["GET"])
def recommendations(request, user_id):
    """Task 1 — database-based quick reorder recommendations."""
    recs = get_db_recommendations(user_id=user_id, top_n=3)
    return Response({
        "user_id": user_id,
        "recommendations": recs,
    })


@api_view(["POST"])
def freshness_check(request):
    """
    Task 2 + Task 4: Classify uploaded produce image as fresh/rotten and return Grad-CAM XAI.
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


@api_view(['POST'])
def product_allergens(request, product_id):
    from rest_framework_simplejwt.authentication import JWTAuthentication
    auth = JWTAuthentication()
    try:
        user, _ = auth.authenticate(request)
    except Exception:
        return Response({'error': 'Unauthorised.'}, status=401)

    try:
        if user.role_name == 'ADMIN':
            product = Product.objects.get(pk=product_id)
        else:
            product = Product.objects.get(pk=product_id, producer__user=user)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    allergen_ids = request.data.get('allergen_ids', [])
    ProductAllergen.objects.filter(product=product).delete()
    for aid in allergen_ids:
        try:
            allergen = Allergen.objects.get(pk=aid)
            ProductAllergen.objects.create(product=product, allergen=allergen)
        except Allergen.DoesNotExist:
            pass
    return Response({'status': 'allergens updated'})
