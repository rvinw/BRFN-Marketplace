from accounts.admin_views import (
    AdminProducerListView,
    AdminProducerVerifyView,
    AdminUserDetailView,
    AdminUserListView,
)
from accounts.views import login_view, register_customer, register_producer
from django.contrib import admin
from django.urls import include, path
from marketplace.admin_views import (
    AdminCategoryDetailView,
    AdminCategoryListView,
    AdminCommunityPostDetailView,
    AdminCommunityPostListView,
    AdminOrderDetailView,
    AdminOrderListView,
    AdminProductDetailView,
    AdminProductListView,
)
from marketplace.cart_views import cart_add_item, cart_detail, cart_item_detail
from marketplace.customer_views import place_order
from marketplace.producer_views import producer_add_product
from marketplace.views import CommunityPostViewSet, ProductViewSet, health
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="products")
router.register(r"community-posts", CommunityPostViewSet)

admin_urlpatterns = [
    path("users/", AdminUserListView.as_view()),
    path("users/<int:pk>/", AdminUserDetailView.as_view()),
    path("producers/", AdminProducerListView.as_view()),
    path("producers/<int:pk>/verify/", AdminProducerVerifyView.as_view()),
    path("products/", AdminProductListView.as_view()),
    path("products/<int:pk>/", AdminProductDetailView.as_view()),
    path("categories/", AdminCategoryListView.as_view()),
    path("categories/<int:pk>/", AdminCategoryDetailView.as_view()),
    path("orders/", AdminOrderListView.as_view()),
    path("orders/<int:pk>/", AdminOrderDetailView.as_view()),
    path("community-posts/", AdminCommunityPostListView.as_view()),
    path("community-posts/<int:pk>/", AdminCommunityPostDetailView.as_view()),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/login/", login_view),
    path("api/auth/register/customer/", register_customer),
    path("api/auth/register/producer/", register_producer),
    path("api/admin/", include(admin_urlpatterns)),
    path("api/orders/", place_order),
    path("api/cart/", cart_detail),
    path("api/cart/items/", cart_add_item),
    path("api/cart/items/<int:product_id>/", cart_item_detail),
    path("api/producer/products/", producer_add_product),
    path("api/", include(router.urls)),
]
