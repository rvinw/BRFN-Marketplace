import { useState } from "react";
import "./CartPage.css";


const SAMPLE_ITEMS = [
  {
    id: 1,
    name: "Farm Fresh Carrots",
    producer: "Green Acres Farm",
    category: "Vegetables",
    price: 1.80,
    unit: "KG",
    quantity: 2,
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=200&q=80",
    organic: true,
  },
  {
    id: 2,
    name: "Sourdough Loaf",
    producer: "The Bread Barn",
    category: "Bakery",
    price: 4.50,
    unit: "EACH",
    quantity: 1,
    image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=200&q=80",
    organic: false,
  },
  {
    id: 3,
    name: "Raw Wildflower Honey",
    producer: "Meadow Hive Co.",
    category: "Preserves",
    price: 6.99,
    unit: "EACH",
    quantity: 1,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&q=80",
    organic: true,
  },
];

export default function CartPage() {
  const [items, setItems] = useState(SAMPLE_ITEMS);

  const updateQty = (id, delta) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = subtotal > 25 ? 0 : 3.99;
  const total = subtotal + delivery;

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Your Cart</h1>
        <p>{items.length} {items.length === 1 ? "item" : "items"} from local producers</p>
      </div>

      <div className="cart-layout">
        {/* Items column */}
        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <h2>Your basket is empty</h2>
              <p>Discover fresh produce from local farmers and makers.</p>
              <button className="btn-primary">Browse Products</button>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.id}>
                <img className="cart-item__img" src={item.image} alt={item.name} />
                <div className="cart-item__info">
                  <h3 className="cart-item__name">{item.name}</h3>
                  <p className="cart-item__producer">{item.producer}</p>
                  <div className="cart-item__badges">
                    <span className="badge badge--category">{item.category}</span>
                    {item.organic && <span className="badge badge--organic">Organic</span>}
                  </div>
                </div>
                <div className="cart-item__actions">
                  <span className="cart-item__price">
                    £{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, +1)}>+</button>
                  </div>
                  <button className="remove-btn" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary column */}
        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{delivery === 0 ? "Free" : `£${delivery.toFixed(2)}`}</span>
          </div>
          {delivery > 0 && (
            <div className="free-delivery-note">
              Add £{(25 - subtotal).toFixed(2)} more for free delivery
            </div>
          )}
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
          <button className="checkout-btn" disabled={items.length === 0}>
            Proceed to Checkout
          </button>
          <button className="continue-link">← Continue shopping</button>
          <p className="producer-note">
            Items may be fulfilled by multiple local producers. Delivery dates will be confirmed at checkout.
          </p>
        </div>
      </div>
    </div>
  )
}

