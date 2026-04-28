import { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/adminApi';

const ROLES = ['CUSTOMER', 'PRODUCER', 'COMMUNITY_GROUP', 'RESTAURANT', 'ADMIN'];

const roleColor = {
  ADMIN:           { bg: '#fef9c3', text: '#854d0e' },
  PRODUCER:        { bg: '#dcfce7', text: '#166534' },
  CUSTOMER:        { bg: '#e0e7ff', text: '#3730a3' },
  COMMUNITY_GROUP: { bg: '#fce7f3', text: '#9d174d' },
  RESTAURANT:      { bg: '#ffedd5', text: '#9a3412' },
};

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role_name: 'CUSTOMER', phone: '' });
  const [saveMsg, setSaveMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/users/');
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      setError('Could not load users. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 2500); };

  const saveEdit = async () => {
    const res = await adminFetch(`/users/${editUser.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(editUser),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(u => u.map(x => x.id === updated.id ? updated : x));
      setEditUser(null);
      flash('User saved.');
    } else {
      const d = await res.json();
      alert(d.error || 'Save failed.');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    const res = await adminFetch(`/users/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(u => u.filter(x => x.id !== id));
      flash('User deleted.');
    } else {
      const d = await res.json();
      alert(d.error || 'Delete failed.');
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      alert('Email and password are required.');
      return;
    }
    const res = await adminFetch('/users/', {
      method: 'POST',
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      const created = await res.json();
      setUsers(u => [...u, created]);
      setShowCreate(false);
      setNewUser({ email: '', password: '', full_name: '', role_name: 'CUSTOMER', phone: '' });
      flash('User created.');
    } else {
      const d = await res.json();
      alert(d.error || 'Create failed.');
    }
  };

  if (loading) return <p className="admin-loading">Loading users...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Users <span className="admin-count">({users.length})</span></h2>
        <div className="admin-header-actions">
          {saveMsg && <span className="admin-flash">{saveMsg}</span>}
          <button onClick={() => setShowCreate(true)} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>+ New User</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th">ID</th>
              <th className="admin-th">Email</th>
              <th className="admin-th">Full Name</th>
              <th className="admin-th">Role</th>
              <th className="admin-th">Active</th>
              <th className="admin-th">Joined</th>
              <th className="admin-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={7} className="admin-td admin-td--empty">No users found.</td></tr>
            ) : users.map(u => {
              const rc = roleColor[u.role_name] || { bg: '#e5e7eb', text: '#374151' };
              return (
                <tr key={u.id} style={{ background: u.is_active ? '#fff' : '#f9fafb' }}>
                  <td className="admin-td">{u.id}</td>
                  <td className="admin-td">{u.email}</td>
                  <td className="admin-td">{u.full_name || <span className="admin-muted">—</span>}</td>
                  <td className="admin-td">
                    <span className="admin-pill" style={{ background: rc.bg, color: rc.text }}>
                      {u.role_name}
                    </span>
                  </td>
                  <td className="admin-td">
                    <span style={{ color: u.is_active ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                      {u.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="admin-td">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}</td>
                  <td className="admin-td">
                    <button onClick={() => setEditUser({ ...u, password: '' })} className="admin-btn" style={{ backgroundColor: '#2c5f2d', color: '#fff' }}>Edit</button>
                    <button onClick={() => deleteUser(u.id)} className="admin-btn" style={{ backgroundColor: '#dc2626', color: '#fff' }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setEditUser(null)}>
          <div className="admin-modal">
            <h3>Edit User</h3>
            <p style={{ color: '#666', marginTop: -8, marginBottom: 16, fontSize: '0.9rem' }}>{editUser.email}</p>
            <div className="admin-form">
              <label className="admin-label">Full Name
                <input value={editUser.full_name || ''} onChange={e => setEditUser({ ...editUser, full_name: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Phone
                <input value={editUser.phone || ''} onChange={e => setEditUser({ ...editUser, phone: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Role
                <select value={editUser.role_name} onChange={e => setEditUser({ ...editUser, role_name: e.target.value })} className="admin-inp">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="admin-label-checkbox">
                <input type="checkbox" checked={editUser.is_active} onChange={e => setEditUser({ ...editUser, is_active: e.target.checked })} />
                Account active
              </label>
              <label className="admin-label">New Password <span style={{ fontWeight: 'normal', color: '#888' }}>(leave blank to keep)</span>
                <input type="password" value={editUser.password || ''} onChange={e => setEditUser({ ...editUser, password: e.target.value })} className="admin-inp" placeholder="Enter new password..." />
              </label>
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => setEditUser(null)} className="admin-btn" style={{ backgroundColor: '#9ca3af', color: '#fff' }}>Cancel</button>
              <button onClick={saveEdit} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="admin-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="admin-modal">
            <h3>Create New User</h3>
            <div className="admin-form">
              <label className="admin-label">Email *
                <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Password *
                <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Full Name
                <input value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Phone
                <input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} className="admin-inp" />
              </label>
              <label className="admin-label">Role
                <select value={newUser.role_name} onChange={e => setNewUser({ ...newUser, role_name: e.target.value })} className="admin-inp">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => setShowCreate(false)} className="admin-btn" style={{ backgroundColor: '#9ca3af', color: '#fff' }}>Cancel</button>
              <button onClick={createUser} className="admin-btn" style={{ backgroundColor: '#a3e635', color: '#000' }}>Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}