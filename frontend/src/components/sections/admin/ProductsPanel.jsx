import { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/adminApi';

const UNITS = ['EACH', 'PACK', 'BUNCH', 'BOX', 'DOZEN', 'G', 'KG', 'ML', 'L'];
const ORGANIC_OPTIONS = ['NON_ORGANIC', 'ORGANIC'];

export default function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', unit_amount: 'EACH',
    stock_quantity: 0, organic_status: 'NON_ORGANIC',
    availability: true, category_id: '', producer_id: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, proRes] = await Promise.all([
        adminFetch('/products/'),
        adminFetch('/categories/'),
        adminFetch('/producers/'),
      ]);
      if (!pRes.ok) throw new Error();
      setProducts(await pRes.json());
      if (cRes.ok) setCategories(await cRes.json());
      if (proRes.ok) setProducers(await proRes.json());
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
      setProducts(list => list.map(x => x.id === data.id ? data : x));
      setEditItem(null);
      flash('Product saved.');
    } else {
      alert('Save failed.');
    }
  };

  const createProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id || !newProduct.producer_id) {
      alert('Name, price, category and producer are required.');
      return;
    }
    const res = await adminFetch('/products/', {
      method: 'POST',
      body: JSON.stringify(newProduct),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(list => [data, ...list]);
      setShowCreate(false);
      setNewProduct({ name: '', description: '', price: '', unit_amount: 'EACH', stock_quantity: 0, organic_status: 'NON_ORGANIC', availability: true, category_id: '', producer_id: '' });
      flash('Product created.');
    } else {
      const d = await res.json();
      alert(d.error || 'Create failed.');
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
  if (error)   return <p className="admin-error">{error}</p>;

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Products <span className="admin-count">({products.length})</span></h2>
        <div className="admin-header-actions">
          {saveMsg && <span className="admin-flash">{saveMsg}</span>}
          <button onClick={() => setShowCreate(true)} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>+ New Product</button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty">No products yet. Add one above or via Django admin.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">ID</th>
                <th className="admin-th">Name</th>
                <th className="admin-th">Category</th>
                <th className="admin-th">Producer</th>
                <th className="admin-th">Price</th>
                <th className="admin-th">Stock</th>
                <th className="admin-th">Unit</th>
                <th className="admin-th">Organic</th>
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
                  <td className="admin-td">{p.producer_name || <span className="admin-muted">—</span>}</td>
                  <td className="admin-td">£{p.price}</td>
                  <td className="admin-td">{p.stock_quantity}</td>
                  <td className="admin-td">{p.unit_amount}</td>
                  <td className="admin-td">
                    <span className="admin-pill" style={{ background: p.organic_status === 'ORGANIC' ? '#dcfce7' : '#f3f4f6', color: p.organic_status === 'ORGANIC' ? '#166534' : '#6b7280' }}>
                      {p.organic_status === 'ORGANIC' ? 'Organic' : 'Non-organic'}
                    </span>
                  </td>
                  <td className="admin-td">
                    <button onClick={() => toggleAvailability(p)} className="admin-btn" style={{ backgroundColor: p.availability ? '#16a34a' : '#6b7280', color: '#fff' }}>
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

      {/* Edit Modal */}
      {editItem && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setEditItem(null)}>
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <h3>Edit Product</h3>
            <div className="admin-form">
              <label className="admin-label">Name
                <input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Category
                <select value={editItem.category_id || ''} onChange={e => setEditItem({ ...editItem, category_id: e.target.value })} className="admin-inp">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </label>
              <label className="admin-label">Price (£)
                <input type="number" step="0.01" min="0" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Unit
                <select value={editItem.unit_amount} onChange={e => setEditItem({ ...editItem, unit_amount: e.target.value })} className="admin-inp">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
              <label className="admin-label">Stock Quantity
                <input type="number" min="0" value={editItem.stock_quantity} onChange={e => setEditItem({ ...editItem, stock_quantity: Number(e.target.value) })} className="admin-inp" />
              </label>
              <label className="admin-label">Organic Status
                <select value={editItem.organic_status} onChange={e => setEditItem({ ...editItem, organic_status: e.target.value })} className="admin-inp">
                  {ORGANIC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
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

      {/* Create Modal */}
      {showCreate && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <h3>New Product</h3>
            <div className="admin-form">
              <label className="admin-label">Name *
                <input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Description
                <input value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Producer *
                <select value={newProduct.producer_id} onChange={e => setNewProduct({ ...newProduct, producer_id: e.target.value })} className="admin-inp">
                  <option value="">Select producer...</option>
                  {producers.map(p => <option key={p.id} value={p.id}>{p.business_name}</option>)}
                </select>
              </label>
              <label className="admin-label">Category *
                <select value={newProduct.category_id} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })} className="admin-inp">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </label>
              <label className="admin-label">Price (£) *
                <input type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Unit
                <select value={newProduct.unit_amount} onChange={e => setNewProduct({ ...newProduct, unit_amount: e.target.value })} className="admin-inp">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
              <label className="admin-label">Stock Quantity
                <input type="number" min="0" value={newProduct.stock_quantity} onChange={e => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })} className="admin-inp" />
              </label>
              <label className="admin-label">Organic Status
                <select value={newProduct.organic_status} onChange={e => setNewProduct({ ...newProduct, organic_status: e.target.value })} className="admin-inp">
                  {ORGANIC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => setShowCreate(false)} className="admin-btn" style={{ backgroundColor: '#9ca3af', color: '#fff' }}>Cancel</button>
              <button onClick={createProduct} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>Create Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
