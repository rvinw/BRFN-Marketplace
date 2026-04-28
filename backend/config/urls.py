from django.contrib import admin
from django.urls import include, path
from marketplace.views import health
from accounts.views import login_view
from marketplace.views import AddProductViewSet, CommunityPostViewSet
# from marketplace.views_api import CategoryViewSet, ProductViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# router.register(r"categories", CategoryViewSet, basename="category")
# router.register(r"products", ProductViewSet, basename="product")
router.register(r'products', AddProductViewSet, basename='products')
router.register(r'community-posts', CommunityPostViewSet)
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/login/", login_view),
    path("api/", include(router.urls)),
]
