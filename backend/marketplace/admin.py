from django.contrib import admin

from .models import Cart, CartItem, Category, Order, OrderItem, OrderProducer, Product

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Order)
admin.site.register(OrderProducer)
admin.site.register(OrderItem)
