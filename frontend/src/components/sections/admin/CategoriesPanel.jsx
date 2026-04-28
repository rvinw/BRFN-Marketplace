import { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/adminApi';

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCat, setNewCat] = useState({ category_name: '', category_description: '' });
  const [saveMsg, setSaveMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/categories/');
      if (!res.ok) throw new Error();
      setCategories(await res.json());
    } catch {
      setError('Could not load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 2500); };

  const saveEdit = async () => {
    const res = await adminFetch(`/categories/${editItem.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(editItem),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories(list => list.map(x => x.id === data.id ? { ...x, ...data } : x));
      setEditItem(null);
      flash('Category saved.');
    } else {
      const d = await res.json();
      alert(d.error || 'Save failed.');
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    const res = await adminFetch(`/categories/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      setCategories(list => list.filter(x => x.id !== id));
      flash('Category deleted.');
    } else {
      const d = await res.json();
      alert(d.error || 'Delete failed.');
    }
  };

  const createCategory = async () => {
    if (!newCat.category_name.trim()) {
      alert('Name is required.');
      return;
    }
    const res = await adminFetch('/categories/', {
      method: 'POST',
      body: JSON.stringify(newCat),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories(list => [...list, data].sort((a, b) => a.category_name.localeCompare(b.category_name)));
      setShowCreate(false);
      setNewCat({ category_name: '', category_description: '' });
      flash('Category created.');
    } else {
      const d = await res.json();
      alert(d.error || 'Create failed.');
    }
  };

  if (loading) return <p className="admin-loading">Loading categories...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Categories <span className="admin-count">({categories.length})</span></h2>
        <div className="admin-header-actions">
          {saveMsg && <span className="admin-flash">{saveMsg}</span>}
          <button onClick={() => setShowCreate(true)} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>+ New Category</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th">ID</th>
              <th className="admin-th">Name</th>
              <th className="admin-th">Description</th>
              <th className="admin-th">Products</th>
              <th className="admin-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={5} className="admin-td admin-td--empty">No categories yet.</td></tr>
            ) : categories.map(c => (
              <tr key={c.id}>
                <td className="admin-td">{c.id}</td>
                <td className="admin-td"><strong>{c.category_name}</strong></td>
                <td className="admin-td admin-td--muted">{c.category_description || <span className="admin-muted">—</span>}</td>
                <td className="admin-td">
                  <span className="admin-pill" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                    {c.product_count}
                  </span>
                </td>
                <td className="admin-td">
                  <button onClick={() => setEditItem({ ...c })} className="admin-btn" style={{ backgroundColor: '#2c5f2d', color: '#fff' }}>Edit</button>
                  <button onClick={() => deleteCategory(c.id)} className="admin-btn" style={{ backgroundColor: '#dc2626', color: '#fff' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editItem && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setEditItem(null)}>
          <div className="admin-modal" style={{ maxWidth: 460 }}>
            <h3>Edit Category</h3>
            <div className="admin-form">
              <label className="admin-label">Name
                <input value={editItem.category_name} onChange={e => setEditItem({ ...editItem, category_name: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Description
                <textarea
                  value={editItem.category_description || ''}
                  onChange={e => setEditItem({ ...editItem, category_description: e.target.value })}
                  className="admin-inp admin-textarea"
                />
              </label>
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => setEditItem(null)} className="admin-btn" style={{ backgroundColor: '#9ca3af', color: '#fff' }}>Cancel</button>
              <button onClick={saveEdit} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="admin-modal" style={{ maxWidth: 460 }}>
            <h3>New Category</h3>
            <div className="admin-form">
              <label className="admin-label">Name *
                <input value={newCat.category_name} onChange={e => setNewCat({ ...newCat, category_name: e.target.value })} className="admin-inp" placeholder="e.g. Root Vegetables" />
              </label>
              <label className="admin-label">Description
                <textarea
                  value={newCat.category_description}
                  onChange={e => setNewCat({ ...newCat, category_description: e.target.value })}
                  className="admin-inp admin-textarea"
                  placeholder="Optional description..."
                />
              </label>
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => setShowCreate(false)} className="admin-btn" style={{ backgroundColor: '#9ca3af', color: '#fff' }}>Cancel</button>
              <button onClick={createCategory} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
