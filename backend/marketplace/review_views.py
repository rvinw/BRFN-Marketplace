from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from marketplace.models import Product, Review
from marketplace.serializers import ReviewSerializer


@api_view(["GET", "POST"])
def product_reviews(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=404)

    if request.method == "GET":
        reviews = Review.objects.filter(product=product).order_by("-created_at")
        serializer = ReviewSerializer(reviews, many=True)
        avg = sum(r.rating for r in reviews) / len(reviews) if reviews else None
        return Response(
            {
                "count": len(reviews),
                "average_rating": round(avg, 1) if avg else None,
                "reviews": serializer.data,
            }
        )

    # POST — must be logged in
    if not request.user.is_authenticated:
        return Response({"error": "Login required to submit a review."}, status=401)

    if request.user.role_name not in ("CUSTOMER", "COMMUNITY_GROUP", "RESTAURANT"):
        return Response({"error": "Only customers can leave reviews."}, status=403)

    if Review.objects.filter(product=product, customer=request.user).exists():
        return Response(
            {"error": "You have already reviewed this product."}, status=400
        )

    rating = request.data.get("rating")
    if not rating or not str(rating).isdigit() or not (1 <= int(rating) <= 5):
        return Response(
            {"error": "Rating must be a number between 1 and 5."}, status=400
        )

    review = Review.objects.create(
        product=product,
        customer=request.user,
        rating=int(rating),
        comment=request.data.get("comment", "").strip() or None,
    )

    return Response(ReviewSerializer(review).data, status=201)
