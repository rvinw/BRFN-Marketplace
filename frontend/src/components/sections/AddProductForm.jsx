import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function AddProductForm() {
  const [allergenOptions, setAllergenOptions] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/allergens/`)
      .then(r => r.json())
      .then(data => setAllergenOptions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const toggleAllergen = (id) => {
    setSelectedAllergens(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const [formData, setFormData] = useState({
    name: '',
    category: 'Dairy',
    description: '',
    price: '',
    unitAmount: '',
    availability: true,
    stockQuantity: 0,
    stockThreshold: '',
    allergyInfo: '',
    harvestDate: '',
    imageUrl: '',
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

    const token = sessionStorage.getItem('brfn_token');
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
    if (formData.stockThreshold) body.append('product_stock_threshold', formData.stockThreshold);
    body.append('harvest_date', formData.harvestDate);
    if (formData.imageUrl) {
      body.append('image_url', formData.imageUrl);
    }

    try {
      const res = await fetch('http://localhost:8000/api/producer/products/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json();

      if (res.ok) {
        if (selectedAllergens.length > 0) {
          await fetch(`${API_URL}/api/products/${data.id}/allergens/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ allergen_ids: selectedAllergens }),
          });
        }
        setMessage(`Product "${data.name}" added successfully!`);
        setFormData({ name: '', category: 'Dairy', description: '', price: '', unitAmount: '', availability: true, stockQuantity: 0, stockThreshold: '', allergyInfo: '', harvestDate: '', imageUrl: '' });
        setSelectedAllergens([]);
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
            <label>Low Stock Threshold</label>
            <input name="stockThreshold" type="number" placeholder="e.g. 10" value={formData.stockThreshold} onChange={handleChange} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Harvest Date</label>
            <input name="harvestDate" type="datetime-local" value={formData.harvestDate} onChange={handleChange} />
          </div>
        </div>

        <label>Product Image URL</label>
        <input name="imageUrl" type="url" placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={handleChange} />

        {allergenOptions.length > 0 && (
          <div>
            <label>Allergens</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 6 }}>
              {allergenOptions.map(a => (
                <label key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem',
                  background: selectedAllergens.includes(a.id) ? '#fef2f2' : '#f3f4f6',
                  border: `1px solid ${selectedAllergens.includes(a.id) ? '#fca5a5' : '#e5e7eb'}`,
                  color: selectedAllergens.includes(a.id) ? '#991b1b' : '#374151',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedAllergens.includes(a.id)}
                    onChange={() => toggleAllergen(a.id)}
                    style={{ margin: 0 }}
                  />
                  {a.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="navitem" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
          {loading ? 'Adding Product...' : 'Submit Product'}
        </button>
      </form>
    </div>
  );
}
