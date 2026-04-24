from rest_framework import permissions, viewsets, generics, status
from rest_framework.views import APIView

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Order
from .serializers import OrderSerializer, OrderStatusUpdateSerializer


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

class IncomingOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.select_related("customer", "producer")
            .prefetch_related("items__product")
            .filter(producer=self.request.user)
            .order_by("-created_at")
        )


class OrderStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, producer=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=404)

        new_status = request.data.get("status")
        ready_for_delivery = request.data.get("ready_for_delivery")

        if new_status:
            order.status = new_status

        if ready_for_delivery is not None:
            order.ready_for_delivery = ready_for_delivery

        order.save()

        return Response(OrderSerializer(order).data, status=200)
