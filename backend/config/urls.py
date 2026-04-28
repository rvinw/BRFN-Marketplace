from django.contrib import admin
from django.urls import include, path
from marketplace.views import health
from accounts.views import login_view
from marketplace.views import AddProductViewSet, CommunityPostViewSet
from rest_framework.routers import DefaultRouter

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
# router.register(r"categories", CategoryViewSet, basename="category")
# router.register(r"products", ProductViewSet, basename="product")
router.register(r'products', AddProductViewSet, basename='products')
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
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/login/", login_view),
    path("api/admin/", include(admin_urlpatterns)),
    path("api/", include(router.urls)),
]
