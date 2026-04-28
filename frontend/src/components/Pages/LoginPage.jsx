import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import './AuthForms.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }

      localStorage.setItem('brfn_token', data.token);
      const role = data.user.role_name.toLowerCase();
      login({ name: data.user.full_name, email: data.user.email, role });

      if (role === 'admin') navigate('/dashboard/admin');
      else if (role === 'producer') navigate('/dashboard/producer');
      else navigate('/dashboard/customer');

    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>
        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email *
            <input
              className="auth-input"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="jane@example.com"
              required
            />
          </label>
          <label className="auth-label">
            Password *
            <input
              className="auth-input"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">New customer? <Link to="/register/customer">Register here</Link></p>
        <p className="auth-footer">Registering as a producer? <Link to="/register/producer">Producer sign up here</Link></p>
      </div>
    </div>
  );
}
