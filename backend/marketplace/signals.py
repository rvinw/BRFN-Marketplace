from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Product, StockNotification

@receiver(pre_save, sender=Product)
def check_low_stock(sender, instance, **kwargs):
    if not instance.pk:
        return  # new product, skip

    if instance.product_stock_threshold is None:
        return  # no threshold set, nothing to check

    try:
        old = Product.objects.get(pk=instance.pk)
    except Product.DoesNotExist:
        return

    was_above = old.stock_quantity > old.product_stock_threshold
    now_at_or_below = instance.stock_quantity <= instance.product_stock_threshold

    if was_above and now_at_or_below:
        StockNotification.objects.create(
            producer=instance.producer,
            product=instance,
            message=f"Low stock alert: '{instance.product_name}' has dropped to {instance.stock_quantity} units (threshold: {instance.product_stock_threshold})."
        )