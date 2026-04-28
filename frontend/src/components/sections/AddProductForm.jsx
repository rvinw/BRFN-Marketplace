import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function AddProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Dairy',
    description: '',
    price: '',
    unitAmount: '',
    availability: true,
    stockQuantity: 0,
    allergyInfo: '',
    harvestDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'stockQuantity') {
      const num = parseInt(value);
      if (num < 0 || num > 1000) return;
    }
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const token = localStorage.getItem('brfn_token');
    if (!token) {
      setMessage('You must be logged in to add products.');
      setLoading(false);
      return;
    }

    const body = new FormData();
    body.append('name', formData.name);
    body.append('category', formData.category);
    body.append('description', formData.description);
    body.append('price', formData.price);
    body.append('unit_amount', formData.unitAmount);
    body.append('availability', formData.availability);
    body.append('stock_quantity', formData.stockQuantity);
    body.append('harvest_date', formData.harvestDate);

    const imageInput = document.querySelector('input[type="file"]');
    if (imageInput?.files[0]) {
      body.append('product_image', imageInput.files[0]);
    }

    try {
      const res = await fetch(`${API_URL}/api/producer/products/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Product "${data.name}" added successfully!`);
        setFormData({ name: '', category: 'Dairy', description: '', price: '', unitAmount: '', availability: true, stockQuantity: 0, allergyInfo: '', harvestDate: '' });
      } else {
        setMessage(data.error || 'Failed to add product.');
      }
    } catch {
      setMessage('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      {message && (
        <p style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 12, background: message.includes('success') ? '#dcfce7' : '#fef2f2', color: message.includes('success') ? '#166534' : '#dc2626', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      <form className="producer-form" onSubmit={handleSubmit}>
        <label>Name *</label>
        <input name="name" type="text" value={formData.name} onChange={handleChange} required />

        <label>Category</label>
        <select name="category" value={formData.category} onChange={handleChange}>
          <option value="Dairy">Dairy</option>
          <option value="Fruit">Fruit</option>
          <option value="Vegetables">Vegetables</option>
          <option value="Meat">Meat</option>
          <option value="Bakery">Bakery</option>
          <option value="Preserves">Preserves</option>
          <option value="Other">Other</option>
        </select>

        <label>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} />

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label>Price *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', color: '#333', fontWeight: 'bold', pointerEvents: 'none' }}>£</span>
              <input name="price" type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={handleChange} required style={{ paddingLeft: '28px', width: '100%' }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label>Unit Amount</label>
            <input name="unitAmount" type="text" placeholder="e.g. kg, each, 500g" value={formData.unitAmount} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label>Stock (0–1000)</label>
            <input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Harvest Date</label>
            <input name="harvestDate" type="datetime-local" value={formData.harvestDate} onChange={handleChange} />
          </div>
        </div>

        <label>Product Image</label>
        <input type="file" accept="image/*" />

        <button type="submit" className="navitem" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
          {loading ? 'Adding Product...' : 'Submit Product'}
        </button>
      </form>
    </div>
  );
}
