import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import './AuthForms.css';

export default function ProducerRegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    business_name: '',
    contact_name: '',
    lead_time_hours: 48,
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/register/producer/', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      localStorage.setItem('brfn_token', data.token);
      login({ name: data.user.full_name, email: data.user.email, role: data.user.role_name.toLowerCase() });
      navigate('/dashboard/producer');
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Register as a Producer</h2>
        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">

          <h4 className="auth-section-title">Account Details</h4>

          <label className="auth-label">Full Name *
            <input className="auth-input" type="text" value={form.full_name} onChange={set('full_name')} required />
          </label>
          <label className="auth-label">Email *
            <input className="auth-input" type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label className="auth-label">Password *
            <input className="auth-input" type="password" value={form.password} onChange={set('password')} minLength={8} required />
          </label>
          <label className="auth-label">Confirm Password *
            <input className="auth-input" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
          </label>
          <label className="auth-label">Phone
            <input className="auth-input" type="tel" value={form.phone} onChange={set('phone')} />
          </label>

          <h4 className="auth-section-title">Business Details</h4>

          <label className="auth-label">Business Name *
            <input className="auth-input" type="text" value={form.business_name} onChange={set('business_name')} required />
          </label>
          <label className="auth-label">Contact Name
            <input className="auth-input" type="text" value={form.contact_name} onChange={set('contact_name')} />
          </label>
          <label className="auth-label">Lead Time (hours)
            <input className="auth-input" type="number" min="0" value={form.lead_time_hours} onChange={set('lead_time_hours')} />
          </label>

          <h4 className="auth-section-title">Business Address</h4>

          <label className="auth-label">Address Line 1 *
            <input className="auth-input" type="text" value={form.address_line_1} onChange={set('address_line_1')} required />
          </label>
          <label className="auth-label">Address Line 2
            <input className="auth-input" type="text" value={form.address_line_2} onChange={set('address_line_2')} />
          </label>
          <div className="auth-row">
            <label className="auth-label">City *
              <input className="auth-input" type="text" value={form.city} onChange={set('city')} required />
            </label>
            <label className="auth-label">Postcode *
              <input className="auth-input" type="text" value={form.postcode} onChange={set('postcode')} required />
            </label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register as Producer'}
          </button>
        </form>

        <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
        <p className="auth-footer">Registering as a customer? <Link to="/register/customer">Customer sign up</Link></p>
      </div>
    </div>
  );
}
