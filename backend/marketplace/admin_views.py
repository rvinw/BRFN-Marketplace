from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.admin_views import IsAdminRole
from .models import AddProduct, Category, CommunityPost, Order


class AdminProductListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        products = AddProduct.objects.all().order_by('-id')
        data = [{
            'id': p.id,
            'name': p.name,
            'category': p.category,
            'price': str(p.price),
            'unit_amount': p.unit_amount,
            'availability': p.availability,
            'stock_quantity': p.stock_quantity,
            'allergy_info': p.allergy_info,
            'harvest_date': p.harvest_date.isoformat() if p.harvest_date else None,
        } for p in products]
        return Response(data)


class AdminProductDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get_object(self, pk):
        try:
            return AddProduct.objects.get(pk=pk)
        except AddProduct.DoesNotExist:
            return None

    def patch(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        for field in ['name', 'category', 'price', 'unit_amount', 'availability', 'stock_quantity', 'allergy_info']:
            if field in request.data:
                setattr(product, field, request.data[field])
        product.save()
        return Response({
            'id': product.id,
            'name': product.name,
            'availability': product.availability,
            'stock_quantity': product.stock_quantity,
        })

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoryListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        categories = Category.objects.all().order_by('category_name')
        data = [{
            'id': c.id,
            'category_name': c.category_name,
            'category_description': c.category_description,
            'product_count': c.products.count(),
        } for c in categories]
        return Response(data)

    def post(self, request):
        name = request.data.get('category_name', '').strip()
        desc = request.data.get('category_description', '').strip()
        if not name:
            return Response({'error': 'category_name is required'}, status=status.HTTP_400_BAD_REQUEST)
        if Category.objects.filter(category_name=name).exists():
            return Response({'error': 'Category already exists'}, status=status.HTTP_400_BAD_REQUEST)
        cat = Category.objects.create(category_name=name, category_description=desc or None)
        return Response({
            'id': cat.id,
            'category_name': cat.category_name,
            'category_description': cat.category_description,
            'product_count': 0,
        }, status=status.HTTP_201_CREATED)


class AdminCategoryDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get_object(self, pk):
        try:
            return Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return None

    def patch(self, request, pk):
        cat = self.get_object(pk)
        if not cat:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        if 'category_name' in request.data:
            cat.category_name = request.data['category_name']
        if 'category_description' in request.data:
            cat.category_description = request.data['category_description']
        cat.save()
        return Response({
            'id': cat.id,
            'category_name': cat.category_name,
            'category_description': cat.category_description,
        })

    def delete(self, request, pk):
        cat = self.get_object(pk)
        if not cat:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        try:
            cat.delete()
        except Exception:
            return Response(
                {'error': 'Cannot delete: category has linked products'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminOrderListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        orders = Order.objects.select_related('customer__user', 'delivery_address').all().order_by('-placed_at')
        data = [{
            'id': o.id,
            'customer_email': o.customer.user.email,
            'customer_name': o.customer.user.full_name,
            'order_status': o.order_status,
            'total_amount': str(o.total_amount),
            'placed_at': o.placed_at.isoformat() if o.placed_at else None,
            'delivery_address': str(o.delivery_address),
        } for o in orders]
        return Response(data)


class AdminOrderDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        if 'order_status' in request.data:
            order.order_status = request.data['order_status']
            order.save()
        return Response({'id': order.id, 'order_status': order.order_status})


class AdminCommunityPostListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        posts = CommunityPost.objects.all().order_by('-created_at')
        data = [{
            'id': p.id,
            'title': p.title,
            'post_type': p.post_type,
            'is_public': p.is_public,
            'description': p.description,
            'created_at': p.created_at.isoformat() if p.created_at else None,
        } for p in posts]
        return Response(data)


class AdminCommunityPostDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get_object(self, pk):
        try:
            return CommunityPost.objects.get(pk=pk)
        except CommunityPost.DoesNotExist:
            return None

    def patch(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        for field in ['title', 'post_type', 'is_public', 'description']:
            if field in request.data:
                setattr(post, field, request.data[field])
        post.save()
        return Response({'id': post.id, 'is_public': post.is_public, 'title': post.title})

    def delete(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
