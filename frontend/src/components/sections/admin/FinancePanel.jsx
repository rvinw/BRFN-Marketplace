import { useState, useEffect, Fragment } from 'react';
import { adminFetch } from '../../../utils/adminApi';

/* ── helpers ── */
const gbp = (v) =>
  `£${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const monthStartISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const yearStartISO = () => `${new Date().getFullYear()}-01-01`;

/* ── shared components ── */
function SummaryCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? '#f0fdf4' : '#f9fafb',
      border: `1px solid ${accent ? '#86efac' : '#e5e7eb'}`,
      borderRadius: 10, padding: '18px 22px', minWidth: 160, flex: 1,
    }}>
      <div style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.45rem', fontWeight: 'bold', marginTop: 6, color: accent ? '#166534' : '#111' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const PAYOUT_STATUSES = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'];
const payoutStyle = {
  PENDING:  { bg: '#fef3c7', text: '#92400e' },
  APPROVED: { bg: '#dbeafe', text: '#1e40af' },
  PAID:     { bg: '#dcfce7', text: '#166534' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
};
const producerStatusStyle = {
  PENDING:   { bg: '#fff7ed', text: '#c2410c' },
  CONFIRMED: { bg: '#eff6ff', text: '#1d4ed8' },
  READY:     { bg: '#fefce8', text: '#92400e' },
  DELIVERED: { bg: '#f0fdf4', text: '#166534' },
  CANCELLED: { bg: '#fef2f2', text: '#991b1b' },
};

/* ══════════════════════════════════════════
   TAB 1 — Commission Report
══════════════════════════════════════════ */
function CommissionReport() {
  const [fromDate, setFromDate] = useState(daysAgoISO(14));
  const [toDate, setToDate] = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  const [downloading, setDownloading] = useState(false);

  const load = async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch(`/finance/orders-report/?from=${from}&to=${to}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError('Could not load commission report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(fromDate, toDate); }, []);

  const applyDates = () => load(fromDate, toDate);

  const preset = (from, to) => {
    setFromDate(from);
    setToDate(to);
    load(from, to);
  };

  const toggleExpand = (id) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const downloadCSV = async () => {
    setDownloading(true);
    try {
      const res = await adminFetch(`/finance/orders-report/csv/?from=${fromDate}&to=${toDate}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brfn_commission_${fromDate}_${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const PRESETS = [
    { label: 'Last 7 days',  from: daysAgoISO(7),   to: todayISO() },
    { label: 'Last 14 days', from: daysAgoISO(14),  to: todayISO() },
    { label: 'Last 30 days', from: daysAgoISO(30),  to: todayISO() },
    { label: 'This month',   from: monthStartISO(), to: todayISO() },
    { label: 'This year',    from: yearStartISO(),  to: todayISO() },
  ];

  return (
    <div>
      {/* ── Date range controls ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 18, padding: '14px 18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#374151' }}>Date range:</span>

        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => preset(p.from, p.to)}
            style={{
              padding: '5px 12px', borderRadius: 6, border: '1px solid #d1d5db',
              background: fromDate === p.from && toDate === p.to ? '#a3e635' : '#fff',
              color: '#111827',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            {p.label}
          </button>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.82rem', color: '#111827', background: '#fff' }} />
          <span style={{ color: '#374151' }}>→</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.82rem', color: '#111827', background: '#fff' }} />
          <button onClick={applyDates} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            Apply
          </button>
        </div>
      </div>

      {loading && <p className="admin-loading">Loading report…</p>}
      {error && <p className="admin-error">{error}</p>}

      {data && (
        <>
          {/* ── Period summary cards ── */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
            <SummaryCard label="Orders (period)" value={data.summary.order_count} sub={`${data.period.from} → ${data.period.to}`} />
            <SummaryCard label="Total Order Value" value={gbp(data.summary.total_order_value)} sub="All paid orders in period" />
            <SummaryCard label="Commission Collected (5%)" value={gbp(data.summary.total_commission)} sub="5% of all order values" accent />
            <SummaryCard label="Net to Producers (95%)" value={gbp(data.summary.total_net)} sub="After commission deduction" />
          </div>

          {/* ── YTD strip ── */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', background: '#1a1a1a', color: '#fff', borderRadius: 8, padding: '10px 20px', marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>Year to date</span>
            <span style={{ fontSize: '0.9rem' }}><strong>{data.ytd.order_count}</strong> orders</span>
            <span style={{ fontSize: '0.9rem' }}>Total value: <strong>{gbp(data.ytd.total_order_value)}</strong></span>
            <span style={{ fontSize: '0.9rem', color: '#a3e635' }}>Commission: <strong>{gbp(data.ytd.total_commission)}</strong></span>
            <button
              onClick={downloadCSV}
              disabled={downloading}
              style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 6, border: 'none', background: '#a3e635', color: '#000', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
            >
              {downloading ? 'Downloading…' : 'Download CSV'}
            </button>
          </div>

          {/* ── Orders table ── */}
          <h3 style={{ margin: '0 0 10px', fontSize: '1rem' }}>
            Orders in period <span style={{ color: '#6b7280', fontWeight: 'normal' }}>({data.orders.length})</span>
          </h3>

          {data.orders.length === 0 ? (
            <div className="admin-empty">No paid orders in this date range.</div>
          ) : (
            <div className="admin-table-wrap" style={{ marginBottom: 28 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">Order</th>
                    <th className="admin-th">Date</th>
                    <th className="admin-th">Customer</th>
                    <th className="admin-th">Order Total</th>
                    <th className="admin-th">Commission (5%)</th>
                    <th className="admin-th">Net to Producers</th>
                    <th className="admin-th">Producers</th>
                    <th className="admin-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map(order => {
                    const isOpen = expanded.has(order.id);
                    const producerNames = order.producers.map(p => p.producer_name).join(', ');
                    return (
                      <Fragment key={order.id}>
                        <tr style={{ background: isOpen ? '#f0fdf4' : undefined }}>
                          <td className="admin-td admin-td--bold">#{order.id}</td>
                          <td className="admin-td" style={{ whiteSpace: 'nowrap' }}>{fmt(order.placed_at)}</td>
                          <td className="admin-td">{order.customer_name}</td>
                          <td className="admin-td admin-td--bold">{gbp(order.total_amount)}</td>
                          <td className="admin-td" style={{ color: '#166534', fontWeight: 600 }}>{gbp(order.commission)}</td>
                          <td className="admin-td">{gbp(order.net_to_producers)}</td>
                          <td className="admin-td admin-td--truncate" style={{ maxWidth: 200 }}>{producerNames}</td>
                          <td className="admin-td">
                            <button
                              onClick={() => toggleExpand(order.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              {isOpen ? 'Hide ▲' : 'Detail ▼'}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr key={`${order.id}-detail`}>
                            <td colSpan={8} style={{ padding: '0 0 0 32px', background: '#f0fdf4' }}>
                              <div style={{ padding: '12px 16px 16px' }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#374151' }}>
                                  Commission calculation: {gbp(order.total_amount)} × 5% = <strong style={{ color: '#166534' }}>{gbp(order.commission)}</strong> &nbsp;|&nbsp; Producer share: {gbp(order.net_to_producers)} (95%)
                                </p>

                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                  <thead>
                                    <tr style={{ background: '#dcfce7' }}>
                                      <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700 }}>Producer</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>Gross (£)</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>Commission 5% (£)</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>Net Payout (£)</th>
                                      <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700 }}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.producers.map((p, i) => {
                                      const sc = producerStatusStyle[p.status] ?? { bg: '#f3f4f6', text: '#374151' };
                                      return (
                                        <tr key={i} style={{ borderTop: '1px solid #bbf7d0' }}>
                                          <td style={{ padding: '6px 12px', fontWeight: 600 }}>{p.producer_name}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>{gbp(p.gross)}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', color: '#166534', fontWeight: 600 }}>{gbp(p.commission)}</td>
                                          <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>{gbp(p.net)}</td>
                                          <td style={{ padding: '6px 12px' }}>
                                            <span style={{ background: sc.bg, color: sc.text, padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                                              {p.status}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Monthly breakdown ── */}
          {data.monthly.length > 0 && (
            <>
              <h3 style={{ margin: '0 0 10px', fontSize: '1rem' }}>Monthly Summary</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="admin-th">Month</th>
                      <th className="admin-th">Orders</th>
                      <th className="admin-th">Total Order Value</th>
                      <th className="admin-th">Commission (5%)</th>
                      <th className="admin-th">Net to Producers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly.map((m, i) => (
                      <tr key={i}>
                        <td className="admin-td admin-td--bold">{m.month}</td>
                        <td className="admin-td">{m.order_count}</td>
                        <td className="admin-td">{gbp(m.total_value)}</td>
                        <td className="admin-td" style={{ color: '#166534', fontWeight: 600 }}>{gbp(m.commission)}</td>
                        <td className="admin-td">{gbp(m.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 2 — Payout Requests
══════════════════════════════════════════ */
function PayoutRequests() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/finance/report/');
      if (!res.ok) throw new Error();
      setReport(await res.json());
    } catch {
      setError('Could not load payout requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, newStatus) => {
    const res = await adminFetch(`/finance/payouts/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReport(prev => ({
        ...prev,
        payouts: prev.payouts.map(p => p.id === id ? updated : p),
      }));
    }
  };

  if (loading) return <p className="admin-loading">Loading payout requests…</p>;
  if (error) return <p className="admin-error">{error}</p>;
  if (!report) return null;

  const { summary, payouts } = report;
  const filtered = statusFilter === 'ALL' ? payouts : payouts.filter(p => p.status === statusFilter);
  const counts = PAYOUT_STATUSES.reduce((acc, s) => ({ ...acc, [s]: payouts.filter(p => p.status === s).length }), {});

  return (
    <div>
      <div className="admin-panel-header">
        <h2 style={{ margin: 0 }}>
          Payout Requests <span className="admin-count">({payouts.length})</span>
        </h2>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          Commission rate: <strong style={{ color: '#000' }}>{summary.commission_rate}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <SummaryCard label="Total Commission Collected" value={gbp(summary.total_commission_collected)} sub="From all payout requests" accent />
        <SummaryCard label="Total Net Payouts" value={gbp(summary.total_net_payouts)} sub="Owed to producers" />
        <SummaryCard label="Pending Payout Amount" value={gbp(summary.pending_payouts_amount)} sub={`${summary.pending_payouts_count} request(s) awaiting action`} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Filter:</span>
        {['ALL', ...PAYOUT_STATUSES].map(s => {
          const sc = payoutStyle[s] || { bg: '#e5e7eb', text: '#374151' };
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className="admin-pill" style={{
              background: active ? (s === 'ALL' ? '#1a1a1a' : sc.bg) : '#f3f4f6',
              color: active ? (s === 'ALL' ? '#fff' : sc.text) : '#374151',
              border: active ? `2px solid ${s === 'ALL' ? '#1a1a1a' : sc.text}` : '2px solid transparent',
              cursor: 'pointer', padding: '4px 12px', fontSize: '0.8rem',
            }}>
              {s}{s !== 'ALL' ? ` (${counts[s]})` : ` (${payouts.length})`}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">No payout requests match this filter.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">ID</th>
                <th className="admin-th">Producer</th>
                <th className="admin-th">Week</th>
                <th className="admin-th">Gross</th>
                <th className="admin-th">Commission (5%)</th>
                <th className="admin-th">Net Payout</th>
                <th className="admin-th">Status</th>
                <th className="admin-th">Requested</th>
                <th className="admin-th">Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const sc = payoutStyle[p.status] || { bg: '#e5e7eb', text: '#374151' };
                const gross = Number(p.gross_amount);
                const commission = Number(p.commission_amount);
                const net = Number(p.net_amount);
                const ok = Math.abs(commission - gross * 0.05) < 0.01;
                return (
                  <tr key={p.id}>
                    <td className="admin-td admin-td--muted">#{p.id}</td>
                    <td className="admin-td admin-td--bold">{p.producer_name}</td>
                    <td className="admin-td" style={{ whiteSpace: 'nowrap' }}>{p.week_start} → {p.week_end}</td>
                    <td className="admin-td">{gbp(gross)}</td>
                    <td className="admin-td">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {gbp(commission)}
                        {!ok && <span title="Commission mismatch" style={{ color: '#ef4444', fontWeight: 'bold' }}>!</span>}
                      </span>
                    </td>
                    <td className="admin-td admin-td--bold">{gbp(net)}</td>
                    <td className="admin-td">
                      <span className="admin-pill" style={{ background: sc.bg, color: sc.text }}>{p.status}</span>
                    </td>
                    <td className="admin-td" style={{ whiteSpace: 'nowrap' }}>
                      {p.requested_at ? new Date(p.requested_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="admin-td">
                      <select value={p.status} onChange={e => updateStatus(p.id, e.target.value)} className="admin-status-select">
                        {PAYOUT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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

/* ══════════════════════════════════════════
   Main export — tab switcher
══════════════════════════════════════════ */
export default function FinancePanel() {
  const [tab, setTab] = useState('report');

  const tabStyle = (id) => ({
    padding: '8px 20px', borderRadius: 8, border: '2px solid #a3e635',
    cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
    background: tab === id ? '#a3e635' : 'transparent', color: '#000',
  });

  return (
    <div>
      <div className="admin-panel-header">
        <h2 style={{ margin: 0 }}>Finance</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={tabStyle('report')} onClick={() => setTab('report')}>
            Commission Report
          </button>
          <button style={tabStyle('payouts')} onClick={() => setTab('payouts')}>
            Payout Requests
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === 'report'  && <CommissionReport />}
        {tab === 'payouts' && <PayoutRequests />}
      </div>
    </div>
  );
}
