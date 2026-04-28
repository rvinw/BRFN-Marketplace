import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { apiFetch } from '../../utils/api';

export default function ProductsPage() {
  const { addToCart, items } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState({});

  useEffect(() => {
    apiFetch('/products/')
      .then(r => r.json())
      .then(data => setProducts(data))
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      unit: product.unit_amount,
      category: product.category,
      image: product.image || null,
    });
    setAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1500);
  };

  const cartCount = (id) => {
    const item = items.find(i => i.id === id);
    return item ? item.quantity : 0;
  };

  if (loading) return <p style={{ padding: '2rem', color: '#666' }}>Loading products...</p>;
  if (error)   return <p style={{ padding: '2rem', color: 'red' }}>{error}</p>;
  if (products.length === 0) return <p style={{ padding: '2rem', color: '#666' }}>No products available yet.</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Products</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {products.map(p => (
          <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            {p.image ? (
              <img src={p.image} alt={p.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: 180, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                No image
              </div>
            )}
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>{p.category}</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{p.name}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', flex: 1 }}>{p.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>£{parseFloat(p.price).toFixed(2)}</span>
                  <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: 4 }}>/ {p.unit_amount}</span>
                </div>
                {cartCount(p.id) > 0 && (
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>× {cartCount(p.id)} in cart</span>
                )}
              </div>
              <button
                onClick={() => handleAdd(p)}
                style={{
                  marginTop: 8,
                  padding: '8px 0',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  backgroundColor: added[p.id] ? '#16a34a' : '#a3e635',
                  color: '#000',
                  transition: 'background 0.2s',
                }}
              >
                {added[p.id] ? '✓ Added' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
