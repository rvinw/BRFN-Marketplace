import { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/adminApi';
import { apiFetch } from '../../../utils/api';

const UNITS = ['EACH', 'PACK', 'BUNCH', 'BOX', 'DOZEN', 'G', 'KG', 'ML', 'L'];
const ORGANIC_OPTIONS = ['NON_ORGANIC', 'ORGANIC'];
const MONTHS = [
  { v: 1, l: 'January' }, { v: 2, l: 'February' }, { v: 3, l: 'March' },
  { v: 4, l: 'April' },   { v: 5, l: 'May' },       { v: 6, l: 'June' },
  { v: 7, l: 'July' },    { v: 8, l: 'August' },    { v: 9, l: 'September' },
  { v: 10, l: 'October' },{ v: 11, l: 'November' }, { v: 12, l: 'December' },
];

const BLANK_PRODUCT = {
  name: '', description: '', price: '', unit_amount: 'EACH',
  stock_quantity: 0, stock_threshold: '', organic_status: 'NON_ORGANIC',
  availability: true, category_id: '', producer_id: '',
  harvest_date: '', image_url: '',
  availability_type: '', start_month: '', end_month: '',
};

export default function ProductsPanel() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [producers, setProducers]   = useState([]);
  const [allergens, setAllergens]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [editItem, setEditItem]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [newProduct, setNewProduct] = useState(BLANK_PRODUCT);
  const [newAllergens, setNewAllergens]   = useState([]);
  const [editAllergens, setEditAllergens] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, proRes, aRes] = await Promise.all([
        adminFetch('/products/'),
        adminFetch('/categories/'),
        adminFetch('/producers/'),
        apiFetch('/allergens/'),
      ]);
      if (!pRes.ok) throw new Error();
      setProducts(await pRes.json());
      if (cRes.ok)  setCategories(await cRes.json());
      if (proRes.ok) setProducers(await proRes.json());
      if (aRes.ok)  setAllergens(await aRes.json());
    } catch {
      setError('Could not load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 2500); };

  const toggleAllergen = (id, list, setList) =>
    setList(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

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
    if (!res.ok) { alert('Save failed.'); return; }
    const data = await res.json();
    setProducts(list => list.map(x => x.id === data.id ? { ...x, ...data } : x));

    if (editAllergens.length > 0) {
      await apiFetch(`/products/${editItem.id}/allergens/`, {
        method: 'POST',
        body: JSON.stringify({ allergen_ids: editAllergens }),
      });
    }
    if (editItem.availability_type) {
      await apiFetch(`/producer/products/${editItem.id}/availability/`, {
        method: 'POST',
        body: JSON.stringify({
          availability_type: editItem.availability_type,
          start_month: editItem.start_month || null,
          end_month: editItem.end_month || null,
        }),
      });
    }
    setEditItem(null);
    flash('Product saved.');
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
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Create failed.'); return; }
    const data = await res.json();
    setProducts(list => [data, ...list]);

    if (newAllergens.length > 0) {
      await apiFetch(`/products/${data.id}/allergens/`, {
        method: 'POST',
        body: JSON.stringify({ allergen_ids: newAllergens }),
      });
    }
    if (newProduct.availability_type) {
      await apiFetch(`/producer/products/${data.id}/availability/`, {
        method: 'POST',
        body: JSON.stringify({
          availability_type: newProduct.availability_type,
          start_month: newProduct.start_month || null,
          end_month: newProduct.end_month || null,
        }),
      });
    }
    setShowCreate(false);
    setNewProduct(BLANK_PRODUCT);
    setNewAllergens([]);
    flash('Product created.');
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const res = await adminFetch(`/products/${id}/`, { method: 'DELETE' });
    if (res.ok) { setProducts(list => list.filter(x => x.id !== id)); flash('Product deleted.'); }
  };

  const openEdit = (p) => { setEditItem({ ...p, availability_type: '', start_month: '', end_month: '' }); setEditAllergens([]); };

  if (loading) return <p className="admin-loading">Loading products...</p>;
  if (error)   return <p className="admin-error">{error}</p>;

  const AllergenPills = ({ selected, setSelected }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {allergens.map(a => {
        const on = selected.includes(a.id);
        return (
          <label key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
            padding: '4px 10px', borderRadius: 20, fontSize: '0.82rem',
            background: on ? '#fef2f2' : '#f3f4f6',
            border: `1px solid ${on ? '#fca5a5' : '#e5e7eb'}`,
            color: on ? '#991b1b' : '#374151',
          }}>
            <input type="checkbox" checked={on} onChange={() => toggleAllergen(a.id, selected, setSelected)} style={{ margin: 0 }} />
            {a.name}
          </label>
        );
      })}
    </div>
  );

  const SeasonalFields = ({ item, setItem }) => (
    <>
      <label className="admin-label">Seasonal Availability
        <select value={item.availability_type || ''} onChange={e => setItem(p => ({ ...p, availability_type: e.target.value }))} className="admin-inp">
          <option value="">— Not set —</option>
          <option value="YEAR_ROUND">Year Round</option>
          <option value="SEASONAL">Seasonal</option>
        </select>
      </label>
      {item.availability_type === 'SEASONAL' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <label className="admin-label" style={{ flex: 1 }}>Start Month
            <select value={item.start_month || ''} onChange={e => setItem(p => ({ ...p, start_month: e.target.value }))} className="admin-inp">
              <option value="">—</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </label>
          <label className="admin-label" style={{ flex: 1 }}>End Month
            <select value={item.end_month || ''} onChange={e => setItem(p => ({ ...p, end_month: e.target.value }))} className="admin-inp">
              <option value="">—</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </label>
        </div>
      )}
    </>
  );

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
        <div className="admin-empty">No products yet.</div>
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
                    <button onClick={() => openEdit(p)} className="admin-btn" style={{ backgroundColor: '#2c5f2d', color: '#fff' }}>Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="admin-btn" style={{ backgroundColor: '#dc2626', color: '#fff' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editItem && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setEditItem(null)}>
          <div className="admin-modal" style={{ maxWidth: 560 }}>
            <h3>Edit Product</h3>
            <div className="admin-form">
              <label className="admin-label">Name
                <input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Description
                <textarea value={editItem.description || ''} onChange={e => setEditItem({ ...editItem, description: e.target.value })} className="admin-inp admin-textarea" />
              </label>
              <label className="admin-label">Category
                <select value={editItem.category_id || ''} onChange={e => setEditItem({ ...editItem, category_id: e.target.value })} className="admin-inp">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label className="admin-label" style={{ flex: 1 }}>Price (£)
                  <input type="number" step="0.01" min="0" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: e.target.value })} className="admin-inp" />
                </label>
                <label className="admin-label" style={{ flex: 1 }}>Unit
                  <select value={editItem.unit_amount} onChange={e => setEditItem({ ...editItem, unit_amount: e.target.value })} className="admin-inp">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <label className="admin-label" style={{ flex: 1 }}>Stock Quantity
                  <input type="number" min="0" value={editItem.stock_quantity} onChange={e => setEditItem({ ...editItem, stock_quantity: Number(e.target.value) })} className="admin-inp" />
                </label>
                <label className="admin-label" style={{ flex: 1 }}>Low Stock Threshold
                  <input type="number" min="0" placeholder="e.g. 10" value={editItem.stock_threshold || ''} onChange={e => setEditItem({ ...editItem, stock_threshold: e.target.value })} className="admin-inp" />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <label className="admin-label" style={{ flex: 1 }}>Harvest Date
                  <input type="date" value={editItem.harvest_date ? editItem.harvest_date.slice(0,10) : ''} onChange={e => setEditItem({ ...editItem, harvest_date: e.target.value })} className="admin-inp" />
                </label>
                <label className="admin-label" style={{ flex: 1 }}>Organic Status
                  <select value={editItem.organic_status} onChange={e => setEditItem({ ...editItem, organic_status: e.target.value })} className="admin-inp">
                    {ORGANIC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              </div>
              <label className="admin-label">Product Image URL
                <input type="url" placeholder="https://example.com/image.jpg" value={editItem.image_url || ''} onChange={e => setEditItem({ ...editItem, image_url: e.target.value })} className="admin-inp" />
              </label>
              <SeasonalFields item={editItem} setItem={setEditItem} />
              {allergens.length > 0 && (
                <label className="admin-label">Allergens
                  <AllergenPills selected={editAllergens} setSelected={setEditAllergens} />
                </label>
              )}
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

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="admin-modal" style={{ maxWidth: 560 }}>
            <h3>New Product</h3>
            <div className="admin-form">
              <label className="admin-label">Name *
                <input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Description
                <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="admin-inp admin-textarea" />
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
              <div style={{ display: 'flex', gap: 12 }}>
                <label className="admin-label" style={{ flex: 1 }}>Price (£) *
                  <input type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="admin-inp" />
                </label>
                <label className="admin-label" style={{ flex: 1 }}>Unit
                  <select value={newProduct.unit_amount} onChange={e => setNewProduct({ ...newProduct, unit_amount: e.target.value })} className="admin-inp">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <label className="admin-label" style={{ flex: 1 }}>Stock Quantity
                  <input type="number" min="0" value={newProduct.stock_quantity} onChange={e => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })} className="admin-inp" />
                </label>
                <label className="admin-label" style={{ flex: 1 }}>Low Stock Threshold
                  <input type="number" min="0" placeholder="e.g. 10" value={newProduct.stock_threshold} onChange={e => setNewProduct({ ...newProduct, stock_threshold: e.target.value })} className="admin-inp" />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <label className="admin-label" style={{ flex: 1 }}>Harvest Date
                  <input type="date" value={newProduct.harvest_date} onChange={e => setNewProduct({ ...newProduct, harvest_date: e.target.value })} className="admin-inp" />
                </label>
                <label className="admin-label" style={{ flex: 1 }}>Organic Status
                  <select value={newProduct.organic_status} onChange={e => setNewProduct({ ...newProduct, organic_status: e.target.value })} className="admin-inp">
                    {ORGANIC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              </div>
              <label className="admin-label">Product Image URL
                <input type="url" placeholder="https://example.com/image.jpg" value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} className="admin-inp" />
              </label>
              <SeasonalFields item={newProduct} setItem={setNewProduct} />
              {allergens.length > 0 && (
                <label className="admin-label">Allergens
                  <AllergenPills selected={newAllergens} setSelected={setNewAllergens} />
                </label>
              )}
              <label className="admin-label-checkbox">
                <input type="checkbox" checked={newProduct.availability} onChange={e => setNewProduct({ ...newProduct, availability: e.target.checked })} />
                Listed / available on site
              </label>
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => { setShowCreate(false); setNewProduct(BLANK_PRODUCT); setNewAllergens([]); }} className="admin-btn" style={{ backgroundColor: '#9ca3af', color: '#fff' }}>Cancel</button>
              <button onClick={createProduct} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>Create Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
