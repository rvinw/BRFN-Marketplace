import { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/adminApi';

const CATEGORIES = ['Dairy', 'Fruit', 'Vegetables', 'Meat', 'Bakery', 'Preserves', 'Other'];

export default function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/products/');
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      setError('Could not load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 2500); };

  const toggleAvailability = async (p) => {
    const res = await adminFetch(`/products/${p.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ availability: !p.availability }),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(list => list.map(x => x.id === p.id ? { ...x, availability: data.availability } : x));
    }
  };

  const saveEdit = async () => {
    const res = await adminFetch(`/products/${editItem.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(editItem),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(list => list.map(x => x.id === data.id ? { ...x, ...editItem, ...data } : x));
      setEditItem(null);
      flash('Product saved.');
    } else {
      alert('Save failed.');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const res = await adminFetch(`/products/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(list => list.filter(x => x.id !== id));
      flash('Product deleted.');
    }
  };

  if (loading) return <p className="admin-loading">Loading products...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Products <span className="admin-count">({products.length})</span></h2>
        {saveMsg && <span className="admin-flash">{saveMsg}</span>}
      </div>

      {products.length === 0 ? (
        <div className="admin-empty">No products yet. Producers can add them via their dashboard.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">ID</th>
                <th className="admin-th">Name</th>
                <th className="admin-th">Category</th>
                <th className="admin-th">Price</th>
                <th className="admin-th">Stock</th>
                <th className="admin-th">Unit</th>
                <th className="admin-th">Visibility</th>
                <th className="admin-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="admin-td">{p.id}</td>
                  <td className="admin-td"><strong>{p.name}</strong></td>
                  <td className="admin-td">{p.category}</td>
                  <td className="admin-td">£{p.price}</td>
                  <td className="admin-td">{p.stock_quantity}</td>
                  <td className="admin-td">{p.unit_amount}</td>
                  <td className="admin-td">
                    <button
                      onClick={() => toggleAvailability(p)}
                      className="admin-btn"
                      style={{ backgroundColor: p.availability ? '#16a34a' : '#6b7280', color: '#fff' }}
                    >
                      {p.availability ? '● Live' : '○ Hidden'}
                    </button>
                  </td>
                  <td className="admin-td">
                    <button onClick={() => setEditItem({ ...p })} className="admin-btn" style={{ backgroundColor: '#2c5f2d', color: '#fff' }}>Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="admin-btn" style={{ backgroundColor: '#dc2626', color: '#fff' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editItem && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setEditItem(null)}>
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <h3>Edit Product</h3>
            <div className="admin-form">
              <label className="admin-label">Name
                <input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Category
                <select value={editItem.category} onChange={e => setEditItem({ ...editItem, category: e.target.value })} className="admin-inp">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="admin-label">Price (£)
                <input type="number" step="0.01" min="0" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Unit Amount
                <input value={editItem.unit_amount} onChange={e => setEditItem({ ...editItem, unit_amount: e.target.value })} className="admin-inp" placeholder="e.g. 500g, 1kg, each" />
              </label>
              <label className="admin-label">Stock Quantity
                <input type="number" min="0" max="1000" value={editItem.stock_quantity} onChange={e => setEditItem({ ...editItem, stock_quantity: Number(e.target.value) })} className="admin-inp" />
              </label>
              <label className="admin-label">Allergy Info
                <input value={editItem.allergy_info || ''} onChange={e => setEditItem({ ...editItem, allergy_info: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label-checkbox">
                <input type="checkbox" checked={editItem.availability} onChange={e => setEditItem({ ...editItem, availability: e.target.checked })} />
                Listed / available on site
              </label>
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => setEditItem(null)} className="admin-btn" style={{ backgroundColor: '#9ca3af', color: '#fff' }}>Cancel</button>
              <button onClick={saveEdit} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}