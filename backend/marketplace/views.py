from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import AddProduct, CommunityPost
from .serializers import AddProductSerializer, CommunityPostSerializer

class AddProductViewSet(viewsets.ModelViewSet):
    queryset = AddProduct.objects.all()
    serializer_class = AddProductSerializer
    

class CommunityPostViewSet(viewsets.ModelViewSet):
    queryset = CommunityPost.objects.all()
    serializer_class = CommunityPostSerializer

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})
