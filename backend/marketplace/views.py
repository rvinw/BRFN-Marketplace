from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Allergen, CommunityPost, Product, ProductAllergen
from .serializers import CommunityPostSerializer, ProductSerializer


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


@api_view(['POST'])
def product_allergens(request, product_id):
    from rest_framework_simplejwt.authentication import JWTAuthentication
    from rest_framework.permissions import IsAuthenticated
    auth = JWTAuthentication()
    try:
        user, _ = auth.authenticate(request)
    except Exception:
        return Response({'error': 'Unauthorised.'}, status=401)

    try:
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
