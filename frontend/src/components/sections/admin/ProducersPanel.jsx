import { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/adminApi';

export default function ProducersPanel() {
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/producers/');
      if (!res.ok) throw new Error();
      setProducers(await res.json());
    } catch {
      setError('Could not load producers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleVerify = async (id) => {
    const res = await adminFetch(`/producers/${id}/verify/`, { method: 'PATCH' });
    if (res.ok) {
      const data = await res.json();
      setProducers(p => p.map(x => x.id === id ? { ...x, is_verified: data.is_verified } : x));
    }
  };

  if (loading) return <p className="admin-loading">Loading producers...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Producers <span className="admin-count">({producers.length})</span></h2>
        <span className="admin-meta">
          {producers.filter(p => p.is_verified).length} verified · {producers.filter(p => !p.is_verified).length} pending
        </span>
      </div>

      {producers.length === 0 ? (
        <div className="admin-empty">No producers registered yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">ID</th>
                <th className="admin-th">Business Name</th>
                <th className="admin-th">User Email</th>
                <th className="admin-th">Contact</th>
                <th className="admin-th">Address</th>
                <th className="admin-th">Lead Time</th>
                <th className="admin-th">Status</th>
                <th className="admin-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {producers.map(p => (
                <tr key={p.id}>
                  <td className="admin-td">{p.id}</td>
                  <td className="admin-td"><strong>{p.business_name}</strong></td>
                  <td className="admin-td">{p.user_email}</td>
                  <td className="admin-td">{p.contact_name || <span className="admin-muted">—</span>}</td>
                  <td className="admin-td">{p.address || <span className="admin-muted">—</span>}</td>
                  <td className="admin-td">{p.lead_time_hours}h</td>
                  <td className="admin-td">
                    <span
                      className="admin-pill-lg"
                      style={{
                        background: p.is_verified ? '#dcfce7' : '#fef3c7',
                        color: p.is_verified ? '#166534' : '#92400e',
                      }}
                    >
                      {p.is_verified ? '✓ Verified' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="admin-td">
                    <button
                      onClick={() => toggleVerify(p.id)}
                      className="admin-btn"
                      style={{ backgroundColor: p.is_verified ? '#dc2626' : '#16a34a', color: '#fff' }}
                    >
                      {p.is_verified ? 'Revoke' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
