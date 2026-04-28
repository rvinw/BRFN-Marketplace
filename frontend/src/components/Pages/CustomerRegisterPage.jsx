import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import './AuthForms.css';

export default function CustomerRegisterPage() {
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
    customer_type: 'INDIVIDUAL',
    org_name: '',
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
      const res = await apiFetch('/auth/register/customer/', {
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
      navigate('/dashboard/customer');
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create a Customer Account</h2>
        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">

          <h4 className="auth-section-title">Account Details</h4>

          <label className="auth-label">
            Full Name *
            <input className="auth-input" type="text" value={form.full_name} onChange={set('full_name')} required />
          </label>

          <label className="auth-label">
            Email *
            <input className="auth-input" type="email" value={form.email} onChange={set('email')} required />
          </label>

          <label className="auth-label">
            Password *
            <input className="auth-input" type="password" value={form.password} onChange={set('password')} minLength={8} required />
          </label>

          <label className="auth-label">
            Confirm Password *
            <input className="auth-input" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
          </label>

          <label className="auth-label">
            Phone
            <input className="auth-input" type="tel" value={form.phone} onChange={set('phone')} />
          </label>

          <h4 className="auth-section-title">Customer Type</h4>

          <label className="auth-label">
            I am a...
            <select className="auth-input" value={form.customer_type} onChange={set('customer_type')}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="COMMUNITY_GROUP">Community Group</option>
              <option value="RESTAURANT">Restaurant</option>
            </select>
          </label>

          {(form.customer_type === 'COMMUNITY_GROUP' || form.customer_type === 'RESTAURANT') && (
            <label className="auth-label">
              Organisation Name *
              <input className="auth-input" type="text" value={form.org_name} onChange={set('org_name')} required />
            </label>
          )}

          <h4 className="auth-section-title">Delivery Address</h4>

          <label className="auth-label">
            Address Line 1 *
            <input className="auth-input" type="text" value={form.address_line_1} onChange={set('address_line_1')} required />
          </label>

          <label className="auth-label">
            Address Line 2
            <input className="auth-input" type="text" value={form.address_line_2} onChange={set('address_line_2')} />
          </label>

          <div className="auth-row">
            <label className="auth-label">
              City *
              <input className="auth-input" type="text" value={form.city} onChange={set('city')} required />
            </label>
            <label className="auth-label">
              Postcode *
              <input className="auth-input" type="text" value={form.postcode} onChange={set('postcode')} required />
            </label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
        <p className="auth-footer">Registering as a producer? <Link to="/register/producer">Producer sign up</Link></p>
      </div>
    </div>
  );
}
