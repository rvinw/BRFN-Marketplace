from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CustomerRegisterView, ProducerRegisterView, MeView

urlpatterns = [
    path("register/customer/", CustomerRegisterView.as_view(), name="register-customer"),
    path("register/producer/", ProducerRegisterView.as_view(), name="register-producer"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
]