import { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/adminApi';

const typeStyle = {
  'Farm Story': { bg: '#dcfce7', text: '#166534' },
  'Recipe':     { bg: '#dbeafe', text: '#1d4ed8' },
};

export default function CommunityPostsPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/community-posts/');
      if (!res.ok) throw new Error();
      setPosts(await res.json());
    } catch {
      setError('Could not load community posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 2500); };

  const togglePublic = async (post) => {
    const res = await adminFetch(`/community-posts/${post.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_public: !post.is_public }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(list => list.map(x => x.id === post.id ? { ...x, is_public: data.is_public } : x));
      flash(data.is_public ? 'Post published.' : 'Post hidden.');
    }
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    const res = await adminFetch(`/community-posts/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      setPosts(list => list.filter(x => x.id !== id));
      flash('Post deleted.');
    }
  };

  if (loading) return <p className="admin-loading">Loading posts...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  const publicCount = posts.filter(p => p.is_public).length;

  return (
    <div>
      <div className="admin-panel-header">
        <h2>Community Posts <span className="admin-count">({posts.length})</span></h2>
        <div className="admin-header-actions">
          {saveMsg && <span className="admin-flash">{saveMsg}</span>}
          <span className="admin-meta">{publicCount} public · {posts.length - publicCount} hidden</span>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="admin-empty">No community posts yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">ID</th>
                <th className="admin-th">Title</th>
                <th className="admin-th">Type</th>
                <th className="admin-th">Visibility</th>
                <th className="admin-th">Created</th>
                <th className="admin-th">Preview</th>
                <th className="admin-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => {
                const ts = typeStyle[p.post_type] || { bg: '#e5e7eb', text: '#374151' };
                return (
                  <tr key={p.id} style={{ background: p.is_public ? '#fff' : '#fafafa' }}>
                    <td className="admin-td">{p.id}</td>
                    <td className="admin-td"><strong>{p.title}</strong></td>
                    <td className="admin-td">
                      <span className="admin-pill" style={{ background: ts.bg, color: ts.text }}>
                        {p.post_type}
                      </span>
                    </td>
                    <td className="admin-td">
                      <span style={{ color: p.is_public ? '#16a34a' : '#9ca3af', fontWeight: 'bold' }}>
                        {p.is_public ? '● Public' : '○ Hidden'}
                      </span>
                    </td>
                    <td className="admin-td">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                    <td className="admin-td admin-td--truncate">{p.description}</td>
                    <td className="admin-td">
                      <button
                        onClick={() => togglePublic(p)}
                        className="admin-btn"
                        style={{ backgroundColor: p.is_public ? '#6b7280' : '#16a34a', color: '#fff' }}
                      >
                        {p.is_public ? 'Hide' : 'Publish'}
                      </button>
                      <button onClick={() => deletePost(p.id)} className="admin-btn" style={{ backgroundColor: '#dc2626', color: '#fff' }}>Delete</button>
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
