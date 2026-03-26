import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CheckoutPage.css";

const CART_ITEMS = [
  {
    id: 1,
    name: "Farm Fresh Carrots",
    producer: "Green Acres Farm",
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
    price: 6.99,
    unit: "EACH",
    quantity: 1,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&q=80",
    organic: true,
  },
];

const STEPS = ["Delivery", "Payment", "Confirmation"];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [delivery, setDelivery] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    postcode: "",
  });

  const [payment, setPayment] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const subtotal = CART_ITEMS.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery_fee = subtotal > 25 ? 0 : 3.99;
  const total = subtotal + delivery_fee;

  const updateDelivery = (e) =>
    setDelivery((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const updatePayment = (e) =>
    setPayment((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const formatCardNumber = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
    setPayment((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const formatExpiry = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    const formatted = raw.length > 2 ? raw.slice(0, 2) + "/" + raw.slice(2) : raw;
    setPayment((prev) => ({ ...prev, expiry: formatted }));
  };

  const deliveryComplete =
    delivery.firstName &&
    delivery.lastName &&
    delivery.email &&
    delivery.address1 &&
    delivery.city &&
    delivery.postcode;

  const paymentComplete =
    payment.cardName &&
    payment.cardNumber.replace(/\s/g, "").length === 16 &&
    payment.expiry.length === 5 &&
    payment.cvv.length >= 3;

  const handleDeliveryNext = (e) => {
    e.preventDefault();
    if (deliveryComplete) setStep(1);
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (paymentComplete) setStep(2);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`step-item ${i === step ? "step-item--active" : ""} ${i < step ? "step-item--done" : ""}`}
            >
              <div className="step-circle">{i < step ? "✓" : i + 1}</div>
              <span className="step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>
      </div>

      {step < 2 ? (
        <div className="checkout-layout">
          {/* Left: Form */}
          <div className="checkout-form-area">

            {/* — Step 0: Delivery — */}
            {step === 0 && (
              <form className="checkout-card" onSubmit={handleDeliveryNext}>
                <h2 className="checkout-section-title">Delivery Details</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      className="form-input"
                      name="firstName"
                      value={delivery.firstName}
                      onChange={updateDelivery}
                      placeholder="Jane"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      className="form-input"
                      name="lastName"
                      value={delivery.lastName}
                      onChange={updateDelivery}
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      className="form-input"
                      type="email"
                      name="email"
                      value={delivery.email}
                      onChange={updateDelivery}
                      placeholder="jane@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      className="form-input"
                      type="tel"
                      name="phone"
                      value={delivery.phone}
                      onChange={updateDelivery}
                      placeholder="07700 900000"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address Line 1 *</label>
                  <input
                    className="form-input"
                    name="address1"
                    value={delivery.address1}
                    onChange={updateDelivery}
                    placeholder="12 Orchard Lane"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address Line 2</label>
                  <input
                    className="form-input"
                    name="address2"
                    value={delivery.address2}
                    onChange={updateDelivery}
                    placeholder="Flat / Building (optional)"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Town / City *</label>
                    <input
                      className="form-input"
                      name="city"
                      value={delivery.city}
                      onChange={updateDelivery}
                      placeholder="Bristol"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Postcode *</label>
                    <input
                      className="form-input"
                      name="postcode"
                      value={delivery.postcode}
                      onChange={updateDelivery}
                      placeholder="BS1 4QX"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="back-link" onClick={() => navigate("/cart")}>
                    ← Back to Cart
                  </button>
                  <button type="submit" className="btn-next" disabled={!deliveryComplete}>
                    Continue to Payment
                  </button>
                </div>
              </form>
            )}

            {/* — Step 1: Payment — */}
            {step === 1 && (
              <form className="checkout-card" onSubmit={handlePlaceOrder}>
                <h2 className="checkout-section-title">Payment</h2>

                <div className="delivery-summary">
                  <p className="delivery-summary__label">Delivering to</p>
                  <p className="delivery-summary__value">
                    {delivery.firstName} {delivery.lastName} &mdash; {delivery.address1},{" "}
                    {delivery.city}, {delivery.postcode}
                  </p>
                  <button type="button" className="edit-link" onClick={() => setStep(0)}>
                    Edit
                  </button>
                </div>

                <div className="form-group">
                  <label>Name on Card *</label>
                  <input
                    className="form-input"
                    name="cardName"
                    value={payment.cardName}
                    onChange={updatePayment}
                    placeholder="Jane Smith"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Card Number *</label>
                  <input
                    className="form-input form-input--card"
                    name="cardNumber"
                    value={payment.cardNumber}
                    onChange={formatCardNumber}
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry *</label>
                    <input
                      className="form-input"
                      name="expiry"
                      value={payment.expiry}
                      onChange={formatExpiry}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV *</label>
                    <input
                      className="form-input"
                      name="cvv"
                      value={payment.cvv}
                      onChange={(e) =>
                        setPayment((prev) => ({
                          ...prev,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      placeholder="123"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <p className="payment-note">
                  Your card details are not stored. This is a demo — no real payment is processed.
                </p>

                <div className="form-actions">
                  <button type="button" className="back-link" onClick={() => setStep(0)}>
                    ← Back
                  </button>
                  <button type="submit" className="btn-next btn-next--pay" disabled={!paymentComplete}>
                    Place Order &mdash; £{total.toFixed(2)}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {CART_ITEMS.map((item) => (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item__img-wrap">
                    <img src={item.image} alt={item.name} className="summary-item__img" />
                    <span className="summary-item__qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item__info">
                    <p className="summary-item__name">{item.name}</p>
                    <p className="summary-item__producer">{item.producer}</p>
                  </div>
                  <span className="summary-item__price">
                    £{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>{delivery_fee === 0 ? "Free" : `£${delivery_fee.toFixed(2)}`}</span>
            </div>
            {delivery_fee > 0 && (
              <div className="free-delivery-note">
                Add £{(25 - subtotal).toFixed(2)} more for free delivery
              </div>
            )}
            <div className="summary-row summary-row--total">
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* — Step 2: Confirmation — */
        <div className="confirmation">
          <div className="confirmation__icon">✓</div>
          <h2>Order Placed!</h2>
          <p>
            Thanks, {delivery.firstName}! Your order has been received. A confirmation will be
            sent to <strong>{delivery.email}</strong>.
          </p>
          <div className="confirmation__summary">
            <p>
              <strong>{CART_ITEMS.length} items</strong> delivering to {delivery.address1},{" "}
              {delivery.city}
            </p>
            <p className="confirmation__total">Total paid: £{total.toFixed(2)}</p>
          </div>
          <button className="btn-next" onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
}
