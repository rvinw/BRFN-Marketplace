import { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/adminApi';

const ORDER_STATUSES = ['PENDING', 'PAID', 'CANCELLED'];

const statusStyle = {
  PENDING:   { bg: '#fef3c7', text: '#92400e' },
  PAID:      { bg: '#dcfce7', text: '#166534' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
};

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/orders/');
      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, order_status) => {
    const res = await adminFetch(`/orders/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ order_status }),
    });
    if (res.ok) {
      const data = await res.json();
      setOrders(list => list.map(x => x.id === id ? { ...x, order_status: data.order_status } : x));
    }
  };

  if (loading) return <p className="admin-loading">Loading orders...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  const totals = ORDER_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.order_status === s).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Orders <span className="admin-count">({orders.length})</span></h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {ORDER_STATUSES.map(s => {
            const sc = statusStyle[s];
            return (
              <span key={s} className="admin-pill-lg" style={{ background: sc.bg, color: sc.text }}>
                {s}: {totals[s]}
              </span>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="admin-empty">No orders placed yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">Order #</th>
                <th className="admin-th">Customer</th>
                <th className="admin-th">Email</th>
                <th className="admin-th">Total</th>
                <th className="admin-th">Status</th>
                <th className="admin-th">Placed</th>
                <th className="admin-th">Delivery Address</th>
                <th className="admin-th">Change Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const sc = statusStyle[o.order_status] || { bg: '#e5e7eb', text: '#374151' };
                return (
                  <tr key={o.id}>
                    <td className="admin-td"><strong>#{o.id}</strong></td>
                    <td className="admin-td">{o.customer_name}</td>
                    <td className="admin-td">{o.customer_email}</td>
                    <td className="admin-td admin-td--bold">£{o.total_amount}</td>
                    <td className="admin-td">
                      <span className="admin-pill" style={{ background: sc.bg, color: sc.text }}>
                        {o.order_status}
                      </span>
                    </td>
                    <td className="admin-td">{o.placed_at ? new Date(o.placed_at).toLocaleDateString() : '—'}</td>
                    <td className="admin-td" style={{ maxWidth: 180 }}>{o.delivery_address}</td>
                    <td className="admin-td">
                      <select
                        value={o.order_status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        className="admin-status-select"
                      >
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}