import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { apiFetch } from "../../utils/api";
import "./CheckoutPage.css";

const STEPS = ["Delivery", "Payment", "Confirmation"];

// Mock payment processor — mirrors Stripe test card behaviour
async function processMockPayment(cardNumber, cvv, expiry) {
  const raw = cardNumber.replace(/\s/g, '');

  // Simulate network / processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (raw === '4000000000000002') return { success: false, error: 'Your card was declined.' };
  if (raw === '4000000000009995') return { success: false, error: 'Your card has insufficient funds.' };
  if (raw === '4000000000000069') return { success: false, error: 'Your card has expired.' };
  if (raw === '4000000000000127') return { success: false, error: 'Your card\'s security code is incorrect.' };

  // All other 16-digit numbers succeed (test mode)
  if (raw.length === 16) return { success: true, transactionId: `TEST-${Date.now()}` };

  return { success: false, error: 'Invalid card number.' };
}

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', label: 'Payment succeeds',         colour: '#16a34a' },
  { number: '4000 0000 0000 0002', label: 'Card declined',            colour: '#dc2626' },
  { number: '4000 0000 0000 9995', label: 'Insufficient funds',       colour: '#dc2626' },
  { number: '4000 0000 0000 0069', label: 'Expired card',             colour: '#d97706' },
  { number: '4000 0000 0000 0127', label: 'Incorrect security code',  colour: '#d97706' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();

  // Redirect to login if token is missing — user may have registered without
  // going through the API (old broken flow) or their session expired
  useEffect(() => {
    if (!localStorage.getItem('brfn_token')) {
      navigate('/login');
    }
  }, []);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [transactionId, setTransactionId] = useState('');

  const [delivery, setDelivery] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', address1: '', address2: '', city: '', postcode: '',
  });

  const [payment, setPayment] = useState({
    cardName: '', cardNumber: '', expiry: '', cvv: '',
  });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery_fee = subtotal > 25 ? 0 : 3.99;
  const total = subtotal + delivery_fee;

  const updateDelivery = (e) => setDelivery(p => ({ ...p, [e.target.name]: e.target.value }));
  const updatePayment  = (e) => setPayment(p  => ({ ...p, [e.target.name]: e.target.value }));

  const formatCardNumber = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    setPayment(p => ({ ...p, cardNumber: raw.replace(/(.{4})/g, '$1 ').trim() }));
  };

  const formatExpiry = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPayment(p => ({ ...p, expiry: raw.length > 2 ? raw.slice(0, 2) + '/' + raw.slice(2) : raw }));
  };

  const deliveryComplete =
    delivery.firstName && delivery.lastName && delivery.email &&
    delivery.address1 && delivery.city && delivery.postcode;

  const paymentComplete =
    payment.cardName &&
    payment.cardNumber.replace(/\s/g, '').length === 16 &&
    payment.expiry.length === 5 &&
    payment.cvv.length >= 3;

  const handleDeliveryNext = (e) => {
    e.preventDefault();
    if (deliveryComplete) setStep(1);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!paymentComplete || submitting) return;

    setSubmitting(true);
    setPaymentError('');

    try {
      // Step 1 — run mock payment processor
      const result = await processMockPayment(payment.cardNumber, payment.cvv, payment.expiry);

      if (!result.success) {
        setPaymentError(result.error);
        return;
      }

      // Step 2 — record order in backend
      const res = await apiFetch('/orders/', {
        method: 'POST',
        body: JSON.stringify({ delivery, items, total }),
      });

      if (res.ok) {
        setConfirmedTotal(total);
        setConfirmedCount(items.length);
        setTransactionId(result.transactionId);
        clearCart();
        setStep(2);
      } else if (res.status === 401) {
        navigate('/login');
      } else {
        const data = await res.json().catch(() => ({}));
        setPaymentError(data.error || `Order failed (${res.status}). Please try again.`);
      }
    } catch {
      setPaymentError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`step-item ${i === step ? 'step-item--active' : ''} ${i < step ? 'step-item--done' : ''}`}>
              <div className="step-circle">{i < step ? '✓' : i + 1}</div>
              <span className="step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>
      </div>

      {step < 2 ? (
        <div className="checkout-layout">
          <div className="checkout-form-area">

            {/* ── Step 0: Delivery ── */}
            {step === 0 && (
              <form className="checkout-card" onSubmit={handleDeliveryNext}>
                <h2 className="checkout-section-title">Delivery Details</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input className="form-input" name="firstName" value={delivery.firstName} onChange={updateDelivery} placeholder="Jane" required />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input className="form-input" name="lastName" value={delivery.lastName} onChange={updateDelivery} placeholder="Smith" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input className="form-input" type="email" name="email" value={delivery.email} onChange={updateDelivery} placeholder="jane@example.com" required />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-input" type="tel" name="phone" value={delivery.phone} onChange={updateDelivery} placeholder="07700 900000" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address Line 1 *</label>
                  <input className="form-input" name="address1" value={delivery.address1} onChange={updateDelivery} placeholder="12 Orchard Lane" required />
                </div>

                <div className="form-group">
                  <label>Address Line 2</label>
                  <input className="form-input" name="address2" value={delivery.address2} onChange={updateDelivery} placeholder="Flat / Building (optional)" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Town / City *</label>
                    <input className="form-input" name="city" value={delivery.city} onChange={updateDelivery} placeholder="Bristol" required />
                  </div>
                  <div className="form-group">
                    <label>Postcode *</label>
                    <input className="form-input" name="postcode" value={delivery.postcode} onChange={updateDelivery} placeholder="BS1 4QX" required />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="back-link" onClick={() => navigate('/cart')}>← Back to Cart</button>
                  <button type="submit" className="btn-next" disabled={!deliveryComplete}>Continue to Payment</button>
                </div>
              </form>
            )}

            {/* ── Step 1: Payment ── */}
            {step === 1 && (
              <form className="checkout-card" onSubmit={handlePlaceOrder}>
                <h2 className="checkout-section-title">Payment</h2>

                <div className="delivery-summary">
                  <p className="delivery-summary__label">Delivering to</p>
                  <p className="delivery-summary__value">
                    {delivery.firstName} {delivery.lastName} &mdash; {delivery.address1}, {delivery.city}, {delivery.postcode}
                  </p>
                  <button type="button" className="edit-link" onClick={() => setStep(0)}>Edit</button>
                </div>

                {/* Test cards reference */}
                <div className="test-cards">
                  <p className="test-cards__title">Test Mode — use these card numbers</p>
                  <div className="test-cards__list">
                    {TEST_CARDS.map(c => (
                      <div key={c.number} className="test-cards__row">
                        <code className="test-cards__number">{c.number}</code>
                        <span className="test-cards__label" style={{ color: c.colour }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="test-cards__note">Any future expiry (e.g. 12/26) · Any 3-digit CVV</p>
                </div>

                {paymentError && (
                  <div className="payment-error">
                    <span className="payment-error__icon">✕</span>
                    {paymentError}
                  </div>
                )}

                <div className="form-group">
                  <label>Name on Card *</label>
                  <input className="form-input" name="cardName" value={payment.cardName} onChange={updatePayment} placeholder="Jane Smith" required />
                </div>

                <div className="form-group">
                  <label>Card Number *</label>
                  <input className="form-input form-input--card" name="cardNumber" value={payment.cardNumber} onChange={formatCardNumber} placeholder="1234 5678 9012 3456" inputMode="numeric" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry *</label>
                    <input className="form-input" name="expiry" value={payment.expiry} onChange={formatExpiry} placeholder="MM/YY" inputMode="numeric" required />
                  </div>
                  <div className="form-group">
                    <label>CVV *</label>
                    <input
                      className="form-input"
                      name="cvv"
                      value={payment.cvv}
                      onChange={e => setPayment(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="123"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="back-link" onClick={() => { setPaymentError(''); setStep(0); }}>← Back</button>
                  <button type="submit" className="btn-next btn-next--pay" disabled={!paymentComplete || submitting}>
                    {submitting ? (
                      <span className="btn-processing">
                        <span className="spinner" /> Processing…
                      </span>
                    ) : (
                      `Pay £${total.toFixed(2)}`
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="checkout-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {items.map(item => (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item__img-wrap">
                    {item.image && <img src={item.image} alt={item.name} className="summary-item__img" />}
                    <span className="summary-item__qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item__info">
                    <p className="summary-item__name">{item.name}</p>
                    {item.producer && <p className="summary-item__producer">{item.producer}</p>}
                  </div>
                  <span className="summary-item__price">£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-row"><span>Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
            <div className="summary-row"><span>Delivery</span><span>{delivery_fee === 0 ? 'Free' : `£${delivery_fee.toFixed(2)}`}</span></div>
            {delivery_fee > 0 && (
              <div className="free-delivery-note">Add £{(25 - subtotal).toFixed(2)} more for free delivery</div>
            )}
            <div className="summary-row summary-row--total"><span>Total</span><span>£{total.toFixed(2)}</span></div>
          </div>
        </div>
      ) : (
        /* ── Step 2: Confirmation ── */
        <div className="confirmation">
          <div className="confirmation__icon">✓</div>
          <h2>Order Placed!</h2>
          <p>
            Thanks, {delivery.firstName}! Your order has been received and payment confirmed.
            A confirmation will be sent to <strong>{delivery.email}</strong>.
          </p>
          <div className="confirmation__summary">
            <p><strong>{confirmedCount} {confirmedCount === 1 ? 'item' : 'items'}</strong> delivering to {delivery.address1}, {delivery.city}</p>
            <p className="confirmation__total">Total paid: £{confirmedTotal.toFixed(2)}</p>
            {transactionId && <p className="confirmation__txn">Transaction ID: {transactionId}</p>}
          </div>
          <button className="btn-next" onClick={() => navigate('/products')}>Continue Shopping</button>
        </div>
      )}
    </div>
  );
}
