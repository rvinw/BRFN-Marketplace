from django.urls import path
from .views_api import IncomingOrderListView, OrderStatusUpdateView

urlpatterns = [
    path("orders/incoming/", IncomingOrderListView.as_view(), name="incoming-orders"),
    path("orders/<int:pk>/status/", OrderStatusUpdateView.as_view(), name="order-status"),
    path("orders/<int:pk>/status/", OrderStatusUpdateView.as_view()),
]