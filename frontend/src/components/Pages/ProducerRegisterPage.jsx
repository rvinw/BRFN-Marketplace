import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProducerRegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // TODO: Replace with real API call
    // const res = await fetch('/api/register/producer', { method: 'POST', body: JSON.stringify(form) })
    // const data = await res.json()
    // login({ name: data.full_name, email: data.email, role: 'producer' })
    login({ name: form.full_name, email: form.email, role: 'producer' });
    navigate('/dashboard/producer');
  };

  const inputStyle = { padding: 10, borderRadius: 6, border: '1px solid #ccc', width: '100%' };
  const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, color: '#444' };

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px' }}>
      <h2>Register as a Producer</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <h4 style={{ margin: 0, color: '#2c5f2d' }}>Account Details</h4>

        <label style={labelStyle}>
          Full Name *
          <input style={inputStyle} type="text" value={form.full_name} onChange={set('full_name')} required />
        </label>

        <label style={labelStyle}>
          Email *
          <input style={inputStyle} type="email" value={form.email} onChange={set('email')} required />
        </label>

        <label style={labelStyle}>
          Password *
          <input style={inputStyle} type="password" value={form.password} onChange={set('password')} required />
        </label>

        <label style={labelStyle}>
          Confirm Password *
          <input style={inputStyle} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
        </label>

        <label style={labelStyle}>
          Phone
          <input style={inputStyle} type="tel" value={form.phone} onChange={set('phone')} />
        </label>

        <h4 style={{ margin: 0, color: '#2c5f2d' }}>Business Details</h4>

        <label style={labelStyle}>
          Business Name *
          <input style={inputStyle} type="text" value={form.business_name} onChange={set('business_name')} required />
        </label>

        <label style={labelStyle}>
          Contact Name
          <input style={inputStyle} type="text" value={form.contact_name} onChange={set('contact_name')} />
        </label>

        <label style={labelStyle}>
          Lead Time (hours) *
          <input style={inputStyle} type="number" min="0" value={form.lead_time_hours} onChange={set('lead_time_hours')} required />
        </label>

        <h4 style={{ margin: 0, color: '#2c5f2d' }}>Business Address</h4>

        <label style={labelStyle}>
          Address Line 1 *
          <input style={inputStyle} type="text" value={form.address_line_1} onChange={set('address_line_1')} required />
        </label>

        <label style={labelStyle}>
          Address Line 2
          <input style={inputStyle} type="text" value={form.address_line_2} onChange={set('address_line_2')} />
        </label>

        <label style={labelStyle}>
          City *
          <input style={inputStyle} type="text" value={form.city} onChange={set('city')} required />
        </label>

        <label style={labelStyle}>
          Postcode *
          <input style={inputStyle} type="text" value={form.postcode} onChange={set('postcode')} required />
        </label>

        <button type="submit" style={{
          padding: 12, background: '#2c5f2d', color: '#fff',
          border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold'
        }}>
          Register as Producer
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
      <p>
        Registering as a customer? <Link to="/register/customer">Customer sign up</Link>
      </p>
    </div>
  );
}
