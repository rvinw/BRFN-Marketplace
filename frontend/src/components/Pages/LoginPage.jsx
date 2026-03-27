import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }

      // Save token for future API calls
      localStorage.setItem('brfn_token', data.token);

      // role_name from DB is "CUSTOMER", "PRODUCER", "ADMIN" — lowercase it
      const role = data.user.role_name.toLowerCase();
      login({ name: data.user.full_name, email: data.user.email, role });

      if (role === 'producer') navigate('/dashboard/producer');
      else if (role === 'admin') navigate('/dashboard/producer');
      else navigate('/dashboard/customer');

    } catch (err) {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email" placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
          required
        />
        <input
          type="password" placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: 10, background: '#2c5f2d', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        New customer? <Link to="/register/customer">Register here</Link>
      </p>
      <p>
        Registering as a producer? <Link to="/register/producer">Producer sign up here</Link>
      </p>
    </div>
  );
}

