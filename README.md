## Setup

### 1) Clone the repo
```bash
git clone https://github.com/rvinw/BRFN-Marketplace.git
cd BRFN-Marketplace
```

### 2) Setup virtual environment
#### Mac/Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### Windows
```bash
py -m venv .venv
.venv\Scripts\activate
```

### 3) Install dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Temp Stuff
After activating the virtual environment, run the following command to start the application:
```bash
cd backend
python manage.py runserver
```
### Open Django Shell
docker compose exec web python manage.py shell

### To see Current orders
from marketplace.models import Order
Order.objects.all()

from marketplace.models import OrderItem
OrderItem.objects.all()

### To Input Testdata for incoming orders

from django.contrib.auth import get_user_model
from marketplace.models import Category, Product, Order, OrderItem

User = get_user_model()


producer = User.objects.get(username="FarmA99")
customer = User.objects.get(username="customer99")


category, _ = Category.objects.get_or_create(name="Vegetables", slug="vegetables")


product = Product.objects.create(
    name="Apples",
    description="Fresh apples",
    price=2.00,
    stock_quantity=50,
    category=category,
    producer=producer
)

order = Order.objects.create(
    customer=customer,
    producer=producer,
    total_price=4.00,
    status="PENDING"
)

OrderItem.objects.create(
    order=order,
    product=product,
    quantity=2,
    unit_price=2.00
)

print(" Order created:", order.id)
