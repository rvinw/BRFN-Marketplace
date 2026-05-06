from accounts.admin_views import (
    AdminProducerListView,
    AdminProducerVerifyView,
    AdminUserDetailView,
    AdminUserListView,
)
from accounts.views import (
    login_view,
    producer_locations,
    register_customer,
    register_producer,
)
from django.contrib import admin
from django.urls import include, path
from marketplace.admin_views import (
    AdminCategoryDetailView,
    AdminCategoryListView,
    AdminCommunityPostDetailView,
    AdminCommunityPostListView,
    AdminFinanceCSVView,
    AdminFinanceOrderReportView,
    AdminFinanceReportView,
    AdminOrderDetailView,
    AdminOrderListView,
    AdminPayoutDetailView,
    AdminProductDetailView,
    AdminProductListView,
)
from marketplace.cart_views import cart_add_item, cart_detail, cart_item_detail
from marketplace.customer_views import orders, producer_incoming_orders
from marketplace.producer_views import (
    cancel_order_item,
    producer_add_product,
    update_order_item_availability,
    update_order_item_status,
    weekly_payout,
)
from marketplace.review_views import product_reviews
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
    path("finance/report/", AdminFinanceReportView.as_view()),
    path("finance/payouts/<int:pk>/", AdminPayoutDetailView.as_view()),
    path("finance/orders-report/", AdminFinanceOrderReportView.as_view()),
    path("finance/orders-report/csv/", AdminFinanceCSVView.as_view()),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/login/", login_view),
    path("api/auth/register/customer/", register_customer),
    path("api/auth/register/producer/", register_producer),
    path("api/admin/", include(admin_urlpatterns)),
    path("api/producers/", producer_locations),
    path("api/orders/", orders),
    path("api/cart/", cart_detail),
    path("api/cart/items/", cart_add_item),
    path("api/cart/items/<int:product_id>/", cart_item_detail),
    path("api/producer/products/", producer_add_product),
    path("api/", include(router.urls)),
    path("api/producer/orders/incoming/", producer_incoming_orders, name="producer-incoming-orders"),
    path("api/producer/order-items/<int:item_id>/cancel/", cancel_order_item, name="cancel-order-item"),
    path("api/producer/order-items/<int:item_id>/status/", update_order_item_status, name="update-order-item-status"),
    path("api/producer/order-items/<int:item_id>/availability/", update_order_item_availability, name="update-order-item-availability"),
    path("api/producer/weekly-payout/", weekly_payout, name="weekly-payout"),
    path("api/products/<int:product_id>/reviews/", product_reviews, name="product-reviews"),
]
