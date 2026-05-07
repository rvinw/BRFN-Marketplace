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
    isOrganic: false,
    allergyInfo: '',
    harvestDate: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [availabilityType, setAvailabilityType] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

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
    const unitLabel = ['kg', 'g', 'l', 'ml'].includes(formData.unitAmount) && formData.unitQuantity
      ? `${formData.unitQuantity}${formData.unitAmount}`
      : formData.unitAmount;
    body.append('unit_amount', unitLabel);
    body.append('availability', formData.availability);
    body.append('organic_status', formData.isOrganic ? 'ORGANIC' : 'NON_ORGANIC');
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
        if (availabilityType) {
          await fetch(`${API_URL}/api/producer/products/${data.id}/availability/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ availability_type: availabilityType, start_month: startMonth || null, end_month: endMonth || null }),
          });
        }
        setMessage(`Product "${data.name}" added successfully!`);
        setFormData({ name: '', category: 'Dairy', description: '', price: '', unitAmount: '', availability: true, stockQuantity: 0, stockThreshold: '', allergyInfo: '', harvestDate: '', imageUrl: '' });
        setSelectedAllergens([]);
        setAvailabilityType(''); setStartMonth(''); setEndMonth('');
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
            <select name="unitAmount" value={formData.unitAmount} onChange={handleChange}>
              <option value="">-- Select --</option>
              <option value="each">Each</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="l">Litre (l)</option>
              <option value="ml">Millilitre (ml)</option>
              <option value="pack">Pack</option>
              <option value="bunch">Bunch</option>
              <option value="box">Box</option>
              <option value="dozen">Dozen</option>
            </select>
            {['kg', 'g', 'l', 'ml'].includes(formData.unitAmount) && (
              <input name="unitQuantity" type="number" min="1" placeholder={`How many ${formData.unitAmount}? e.g. 500`} value={formData.unitQuantity || ''} onChange={handleChange} style={{ marginTop: 6 }} />
            )}
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label>Organic</label>
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, isOrganic: !p.isOrganic }))}
              style={{
                padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                background: formData.isOrganic ? '#a3e635' : '#f3f4f6',
                border: '1px solid #d1d5db', color: '#374151',
              }}
            >
              {formData.isOrganic ? '✓ Organic' : 'Mark as Organic'}
            </button>
          </div>
        </div>

        <label>Product Image URL</label>
        <input name="imageUrl" type="url" placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={handleChange} />

        <label>Seasonal Availability</label>
        <select value={availabilityType} onChange={e => setAvailabilityType(e.target.value)}>
          <option value="">-- Select (optional) --</option>
          <option value="YEAR_ROUND">Year Round</option>
          <option value="SEASONAL">Seasonal</option>
        </select>
        {availabilityType === 'SEASONAL' && (
          <div style={{ display: 'flex', gap: '20px', marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Start Month (1-12)</label>
              <input type="number" min="1" max="12" placeholder="e.g. 3" value={startMonth} onChange={e => setStartMonth(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>End Month (1-12)</label>
              <input type="number" min="1" max="12" placeholder="e.g. 9" value={endMonth} onChange={e => setEndMonth(e.target.value)} />
            </div>
          </div>
        )}

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
