import csv
from datetime import date
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.admin_views import IsAdminRole
from .models import Category, CommunityPost, Order, PayoutRequest, Product
from accounts.models import ProducerProfile


def _product_data(p):
    return {
        'id': p.id,
        'name': p.product_name,
        'category': p.category.category_name if p.category else '',
        'category_id': p.category_id,
        'price': str(p.current_price),
        'unit_amount': p.product_unit,
        'availability': p.is_available,
        'stock_quantity': str(p.stock_quantity),
        'organic_status': p.organic_status,
        'producer_id': p.producer_id,
        'producer_name': p.producer.business_name if p.producer else '',
        'harvest_date': p.harvest_date.isoformat() if p.harvest_date else None,
    }


class AdminProductListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        products = Product.objects.select_related('category', 'producer').order_by('-created_at')
        return Response([_product_data(p) for p in products])

    def post(self, request):
        try:
            product = Product.objects.create(
                product_name=request.data.get('name', '').strip(),
                product_description=request.data.get('description', '').strip(),
                current_price=request.data.get('price'),
                product_unit=request.data.get('unit_amount', 'EACH'),
                stock_quantity=request.data.get('stock_quantity', 0),
                organic_status=request.data.get('organic_status', 'NON_ORGANIC'),
                is_available=request.data.get('availability', True),
                category_id=request.data.get('category_id'),
                producer_id=request.data.get('producer_id'),
            )
            return Response(_product_data(product), status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminProductDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get_object(self, pk):
        try:
            return Product.objects.select_related('category', 'producer').get(pk=pk)
        except Product.DoesNotExist:
            return None

    def patch(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        field_map = {
            'name': 'product_name',
            'description': 'product_description',
            'price': 'current_price',
            'unit_amount': 'product_unit',
            'availability': 'is_available',
            'stock_quantity': 'stock_quantity',
            'organic_status': 'organic_status',
            'category_id': 'category_id',
        }
        for frontend_field, model_field in field_map.items():
            if frontend_field in request.data:
                setattr(product, model_field, request.data[frontend_field])
        product.save()
        return Response(_product_data(product))

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
            'product_count': cat.products.count(),
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


PAYOUT_STATUSES = ['PENDING', 'PAID']


def _payout_data(p):
    return {
        'id': p.id,
        'producer_id': p.producer_id,
        'producer_name': p.producer.business_name if p.producer else '',
        'week_start': p.week_start.isoformat(),
        'week_end': p.week_end.isoformat(),
        'gross_amount': str(p.gross_amount),
        'commission_amount': str(p.commission_amount),
        'net_amount': str(p.net_amount),
        'status': p.status,
        'requested_at': p.requested_at.isoformat() if p.requested_at else None,
    }


class AdminFinanceReportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        payouts = PayoutRequest.objects.select_related('producer').order_by('-requested_at')

        agg = payouts.aggregate(
            total_gross=Sum('gross_amount'),
            total_commission=Sum('commission_amount'),
            total_net=Sum('net_amount'),
        )
        pending_agg = payouts.filter(status='PENDING').aggregate(amount=Sum('net_amount'))
        paid_agg    = payouts.filter(status='PAID').aggregate(amount=Sum('net_amount'))

        total_order_revenue = Order.objects.filter(
            order_status='PAID'
        ).aggregate(revenue=Sum('total_amount'))['revenue'] or Decimal('0.00')

        summary = {
            'commission_rate': '5%',
            'total_order_revenue': str(total_order_revenue),
            'total_commission_collected': str(agg['total_commission'] or Decimal('0.00')),
            'total_net_payouts': str(agg['total_net'] or Decimal('0.00')),
            'pending_payouts_count': payouts.filter(status='PENDING').count(),
            'pending_payouts_amount': str(pending_agg['amount'] or Decimal('0.00')),
            'approved_payouts_count': payouts.filter(status='PAID').count(),
            'approved_payouts_amount': str(paid_agg['amount'] or Decimal('0.00')),
        }

        return Response({
            'summary': summary,
            'payouts': [_payout_data(p) for p in payouts],
        })


class AdminPayoutDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            payout = PayoutRequest.objects.select_related('producer').get(pk=pk)
        except PayoutRequest.DoesNotExist:
            return Response({'error': 'Payout request not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in PAYOUT_STATUSES:
            return Response({'error': f'Invalid status. Choose from: {PAYOUT_STATUSES}'}, status=status.HTTP_400_BAD_REQUEST)

        payout.status = new_status
        payout.save()
        return Response(_payout_data(payout))


_COMMISSION_RATE = Decimal('0.05')


def _parse_date_range(request):
    today = timezone.now().date()
    from_str = request.query_params.get('from', '')
    to_str = request.query_params.get('to', '')
    try:
        from_date = date.fromisoformat(from_str) if from_str else today - timezone.timedelta(days=14)
    except ValueError:
        from_date = today - timezone.timedelta(days=14)
    try:
        to_date = date.fromisoformat(to_str) if to_str else today
    except ValueError:
        to_date = today
    return from_date, to_date


def _orders_in_range(from_date, to_date):
    return (
        Order.objects
        .filter(order_status='PAID', placed_at__date__gte=from_date, placed_at__date__lte=to_date)
        .select_related('customer__user')
        .prefetch_related('producer_orders__producer', 'producer_orders__items')
        .order_by('-placed_at')
    )


def _order_to_dict(order):
    commission = (order.total_amount * _COMMISSION_RATE).quantize(Decimal('0.01'))
    producers = []
    for op in order.producer_orders.all():
        gross = sum((i.total_cost for i in op.items.all()), Decimal('0.00'))
        p_commission = (gross * _COMMISSION_RATE).quantize(Decimal('0.01'))
        producers.append({
            'producer_name': op.producer.business_name,
            'status': op.status,
            'gross': str(gross),
            'commission': str(p_commission),
            'net': str((gross - p_commission).quantize(Decimal('0.01'))),
        })
    return {
        'id': order.id,
        'placed_at': order.placed_at.isoformat(),
        'customer_name': order.customer.user.full_name,
        'order_status': order.order_status,
        'total_amount': str(order.total_amount),
        'commission': str(commission),
        'net_to_producers': str((order.total_amount - commission).quantize(Decimal('0.01'))),
        'producers': producers,
    }


class AdminFinanceOrderReportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        from_date, to_date = _parse_date_range(request)
        orders_qs = _orders_in_range(from_date, to_date)

        orders_data = [_order_to_dict(o) for o in orders_qs]
        period_total = sum((Decimal(o['total_amount']) for o in orders_data), Decimal('0.00'))
        period_commission = (period_total * _COMMISSION_RATE).quantize(Decimal('0.01'))

        # Year-to-date
        ytd_start = date(timezone.now().year, 1, 1)
        ytd_agg = Order.objects.filter(
            order_status='PAID', placed_at__date__gte=ytd_start
        ).aggregate(total=Sum('total_amount'), count=Count('id'))
        ytd_total = ytd_agg['total'] or Decimal('0.00')
        ytd_commission = (ytd_total * _COMMISSION_RATE).quantize(Decimal('0.01'))

        # Monthly breakdown (last 12 months, all time)
        monthly_raw = (
            Order.objects
            .filter(order_status='PAID')
            .annotate(month=TruncMonth('placed_at'))
            .values('month')
            .annotate(count=Count('id'), total=Sum('total_amount'))
            .order_by('-month')[:12]
        )
        monthly = []
        for m in monthly_raw:
            mv = m['total'] or Decimal('0.00')
            mc = (mv * _COMMISSION_RATE).quantize(Decimal('0.01'))
            monthly.append({
                'month': m['month'].strftime('%B %Y') if m['month'] else '',
                'order_count': m['count'],
                'total_value': str(mv),
                'commission': str(mc),
                'net': str((mv - mc).quantize(Decimal('0.01'))),
            })

        return Response({
            'period': {'from': str(from_date), 'to': str(to_date)},
            'commission_rate': '5%',
            'summary': {
                'order_count': len(orders_data),
                'total_order_value': str(period_total),
                'total_commission': str(period_commission),
                'total_net': str((period_total - period_commission).quantize(Decimal('0.01'))),
            },
            'ytd': {
                'order_count': ytd_agg['count'] or 0,
                'total_order_value': str(ytd_total),
                'total_commission': str(ytd_commission),
            },
            'monthly': monthly,
            'orders': orders_data,
        })


class AdminFinanceCSVView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        from_date, to_date = _parse_date_range(request)
        orders_qs = _orders_in_range(from_date, to_date)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = (
            f'attachment; filename="brfn_commission_{from_date}_{to_date}.csv"'
        )
        writer = csv.writer(response)
        writer.writerow([
            'Order ID', 'Date', 'Customer', 'Order Status',
            'Order Total (£)', 'Commission 5% (£)', 'Net to Producers (£)',
            'Producer', 'Producer Gross (£)', 'Producer Commission (£)', 'Producer Net (£)',
        ])

        for order in orders_qs:
            commission = (order.total_amount * _COMMISSION_RATE).quantize(Decimal('0.01'))
            net = (order.total_amount - commission).quantize(Decimal('0.01'))
            date_str = order.placed_at.strftime('%d/%m/%Y')
            customer = order.customer.user.full_name
            ops = list(order.producer_orders.all())

            for i, op in enumerate(ops):
                gross = sum((item.total_cost for item in op.items.all()), Decimal('0.00'))
                pc = (gross * _COMMISSION_RATE).quantize(Decimal('0.01'))
                pn = (gross - pc).quantize(Decimal('0.01'))
                prefix = (
                    [f'#{order.id}', date_str, customer, order.order_status,
                     f'{order.total_amount:.2f}', f'{commission:.2f}', f'{net:.2f}']
                    if i == 0 else ['', '', '', '', '', '', '']
                )
                writer.writerow(prefix + [op.producer.business_name, f'{gross:.2f}', f'{pc:.2f}', f'{pn:.2f}'])

            if not ops:
                writer.writerow([
                    f'#{order.id}', date_str, customer, order.order_status,
                    f'{order.total_amount:.2f}', f'{commission:.2f}', f'{net:.2f}',
                    '—', '—', '—', '—',
                ])

        return response
