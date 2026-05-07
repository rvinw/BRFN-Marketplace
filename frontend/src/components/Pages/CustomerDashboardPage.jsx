import { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import './CustomerDashboard.css';

const STATUS_CLASS = {
  PENDING:   'status-badge--pending',
  PAID:      'status-badge--paid',
  CANCELLED: 'status-badge--cancelled',
};

const PRODUCER_STATUS_COLOUR = {
  PENDING:   { bg: '#fff7ed', text: '#c2410c' },
  CONFIRMED: { bg: '#eff6ff', text: '#1d4ed8' },
  READY:     { bg: '#fefce8', text: '#92400e' },
  DELIVERED: { bg: '#f0fdf4', text: '#15803d' },
  CANCELLED: { bg: '#fef2f2', text: '#b91c1c' },
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${STATUS_CLASS[status] ?? ''}`}>
      {status}
    </span>
  );
}

function OrderCard({ order, onReorder }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(order.placed_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const addr = order.delivery_address;
  const addrLine = [addr.line_1, addr.line_2, addr.city, addr.postcode]
    .filter(Boolean).join(', ');

  const allItems = order.producers?.flatMap(p => p.items) ?? [];
  const unavailableCount = allItems.filter(i => !i.is_available).length;

  return (
    <div className="order-card">
      <div className="order-card-header">
        <span className="order-card-id">Order #{order.id}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusBadge status={order.order_status} />
          <button
            onClick={() => setExpanded(e => !e)}
            className="order-card-toggle"
          >
            {expanded ? 'Hide details ▲' : 'View details ▼'}
          </button>
        </div>
      </div>

      <div className="order-card-date">Placed {date}</div>

      <div className="order-card-address">
        <span>Deliver to:</span> {addrLine}
      </div>

      <div className="order-card-footer">
        <span className="order-card-total">£{parseFloat(order.total_amount).toFixed(2)}</span>
        {order.order_status !== 'CANCELLED' && (
          <button
            onClick={() => onReorder(order)}
            className="order-card-reorder"
            title={unavailableCount > 0 ? `${unavailableCount} item(s) currently unavailable` : 'Add all items to cart'}
          >
            {unavailableCount > 0 ? `Reorder (${unavailableCount} unavailable)` : 'Reorder'}
          </button>
        )}
      </div>

      {expanded && order.producers && order.producers.length > 0 && (
        <div className="order-detail">
          {order.producers.map((producer, pi) => {
            const sc = PRODUCER_STATUS_COLOUR[producer.status] ?? { bg: '#f3f4f6', text: '#374151' };
            return (
              <div key={pi} className="order-producer-group">
                <div className="order-producer-header">
                  <span className="order-producer-name">{producer.producer_name}</span>
                  <span className="order-producer-status" style={{ background: sc.bg, color: sc.text }}>
                    {producer.status}
                  </span>
                </div>

                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Total</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {producer.items.map((item, ii) => (
                      <tr key={ii} style={{ opacity: item.is_available ? 1 : 0.55 }}>
                        <td>{item.product_name}</td>
                        <td>{parseFloat(item.quantity).toLocaleString()} {item.unit}</td>
                        <td>£{parseFloat(item.unit_price_gbp).toFixed(2)}</td>
                        <td>£{parseFloat(item.total_cost).toFixed(2)}</td>
                        <td>
                          {item.is_available
                            ? <span style={{ color: '#15803d', fontWeight: 600, fontSize: '0.75rem' }}>Available</span>
                            : <span style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.75rem' }}>Unavailable</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 8 }}>
            Payment: card ending ••••  · Address stored securely
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboardPage() {
  const [view, setView] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reorderMsg, setReorderMsg] = useState('');
  const [standingOrders, setStandingOrders] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    apiFetch('/orders/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load orders');
        return res.json();
      })
      .then(data => setOrders(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    apiFetch('/standing-orders/')
      .then(res => res.ok ? res.json() : [])
      .then(data => setStandingOrders(Array.isArray(data) ? data : []));
  }, []);

  const cancelStandingOrder = async (id) => {
    await apiFetch(`/standing-orders/${id}/`, { method: 'DELETE' });
    setStandingOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleReorder = (order) => {
    const allItems = order.producers?.flatMap(p => p.items) ?? [];
    const available = allItems.filter(i => i.is_available);
    const skipped = allItems.length - available.length;

    available.forEach(item => {
      addToCart({
        id: item.product_id,
        name: item.product_name,
        price: parseFloat(item.unit_price_gbp),
        unit: item.unit,
        quantity: parseFloat(item.quantity),
      });
    });

    if (available.length === 0) {
      setReorderMsg('None of the items from this order are currently available.');
    } else if (skipped > 0) {
      setReorderMsg(`${available.length} item(s) added to cart. ${skipped} item(s) skipped — currently unavailable.`);
    } else {
      setReorderMsg(`${available.length} item(s) added to cart.`);
    }

    setTimeout(() => setReorderMsg(''), 5000);
  };

  return (
    <div className="customer-dashboard">
      <h1>My Account</h1>

      <nav style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: 0 }}>
        {[{ id: 'orders', label: 'My Orders' }, { id: 'standing', label: 'Standing Orders' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontWeight: 600, fontSize: '0.9rem',
              color: view === tab.id ? '#111827' : '#6b7280',
              borderBottom: view === tab.id ? '2px solid #111827' : '2px solid transparent',
              marginBottom: -2, outline: 'none', boxShadow: 'none', borderRadius: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {view === 'orders' && (
        <>
          {reorderMsg && <div className="reorder-banner">{reorderMsg}</div>}
          {loading && <p className="customer-dashboard-loading">Loading orders…</p>}
          {error && <p className="customer-dashboard-error">{error}</p>}
          {!loading && !error && orders.length === 0 && (
            <div className="customer-dashboard-empty">
              <p>No orders yet.</p>
              <p>Your orders will appear here once you place one.</p>
            </div>
          )}
          <div className="order-list">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onReorder={handleReorder} />
            ))}
          </div>
        </>
      )}

      {view === 'standing' && (
        <>
          {standingOrders.length === 0 ? (
            <div className="customer-dashboard-empty">
              <p>No standing orders yet.</p>
              <p>Add items to your cart and click <strong>↻ Repeat weekly</strong> to set one up.</p>
            </div>
          ) : (
            <div className="order-list">
              {standingOrders.map(o => (
                <div key={o.id} className="order-card">
                  <div className="order-card-header">
                    <span className="order-card-id">{o.product_name}</span>
                    <span style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700 }}>Weekly</span>
                  </div>
                  <div className="order-card-date">
                    Qty: {o.quantity} · £{parseFloat(o.price).toFixed(2)} / {o.product_unit}
                  </div>
                  <div className="order-card-address">
                    <span>Next delivery:</span> {(() => {
                      const next = new Date();
                      next.setDate(next.getDate() + (7 - next.getDay() + 1) % 7 || 7);
                      return next.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    })()}
                  </div>
                  <div className="order-card-footer" style={{ justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => cancelStandingOrder(o.id)}
                      style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      Cancel standing order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
