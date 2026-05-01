from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from marketplace.views import health, ProductViewSet, CommunityPostViewSet
from marketplace.customer_views import place_order
from marketplace.producer_views import producer_add_product, cancel_order_item, update_order_item_status, weekly_payout
from accounts.views import login_view, register_customer, register_producer
from marketplace.customer_views import producer_incoming_orders

from accounts.admin_views import (
    AdminUserListView,
    AdminUserDetailView,
    AdminProducerListView,
    AdminProducerVerifyView,
)
from marketplace.admin_views import (
    AdminProductListView,
    AdminProductDetailView,
    AdminCategoryListView,
    AdminCategoryDetailView,
    AdminOrderListView,
    AdminOrderDetailView,
    AdminCommunityPostListView,
    AdminCommunityPostDetailView,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='products')
router.register(r'community-posts', CommunityPostViewSet)

admin_urlpatterns = [
    path('users/', AdminUserListView.as_view()),
    path('users/<int:pk>/', AdminUserDetailView.as_view()),
    path('producers/', AdminProducerListView.as_view()),
    path('producers/<int:pk>/verify/', AdminProducerVerifyView.as_view()),
    path('products/', AdminProductListView.as_view()),
    path('products/<int:pk>/', AdminProductDetailView.as_view()),
    path('categories/', AdminCategoryListView.as_view()),
    path('categories/<int:pk>/', AdminCategoryDetailView.as_view()),
    path('orders/', AdminOrderListView.as_view()),
    path('orders/<int:pk>/', AdminOrderDetailView.as_view()),
    path('community-posts/', AdminCommunityPostListView.as_view()),
    path('community-posts/<int:pk>/', AdminCommunityPostDetailView.as_view()),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health),
    path('api/auth/login/', login_view),
    path('api/auth/register/customer/', register_customer),
    path('api/auth/register/producer/', register_producer),
    path('api/admin/', include(admin_urlpatterns)),
    path('api/orders/', place_order),
    path('api/producer/products/', producer_add_product),
    path('api/', include(router.urls)),
    path("api/producer/orders/incoming/", producer_incoming_orders, name="producer-incoming-orders"),
    path("api/producer/order-items/<int:item_id>/cancel/", cancel_order_item, name="cancel-order-item"),
    path("api/producer/order-items/<int:item_id>/status/", update_order_item_status, name="update-order-item-status"),
    path("api/producer/weekly-payout/", weekly_payout, name="weekly-payout"),
]


