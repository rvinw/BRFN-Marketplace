import { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import './CustomerDashboard.css';

const STATUS_CLASS = {
  PENDING:   'status-badge--pending',
  PAID:      'status-badge--paid',
  CANCELLED: 'status-badge--cancelled',
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${STATUS_CLASS[status] ?? ''}`}>
      {status}
    </span>
  );
}

function OrderCard({ order }) {
  const date = new Date(order.placed_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const addr = order.delivery_address;
  const addrLine = [addr.line_1, addr.line_2, addr.city, addr.postcode]
    .filter(Boolean).join(', ');

  return (
    <div className="order-card">
      <div className="order-card-header">
        <span className="order-card-id">Order #{order.id}</span>
        <StatusBadge status={order.order_status} />
      </div>
      <div className="order-card-date">Placed {date}</div>
      <div className="order-card-address">
        <span>Deliver to:</span> {addrLine}
      </div>
      <div className="order-card-total">£{parseFloat(order.total_amount).toFixed(2)}</div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/orders/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load orders');
        return res.json();
      })
      .then(data => setOrders(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="customer-dashboard">
      <h1>My Orders</h1>

      {loading && <p className="customer-dashboard-loading">Loading orders...</p>}

      {error && <p className="customer-dashboard-error">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="customer-dashboard-empty">
          <p>No orders yet.</p>
          <p>Your orders will appear here once you place one.</p>
        </div>
      )}

      <div className="order-list">
        {orders.map(order => <OrderCard key={order.id} order={order} />)}
      </div>
    </div>
  );
}
