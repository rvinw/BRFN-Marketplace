import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { apiFetch } from '../../utils/api';

const CATEGORY_LABELS = ['Vegetables', 'Dairy', 'Bakery', 'Preserves', 'Seasonal', 'Meat'];

export default function ProductsPage() {
  const { addToCart, items } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState({});

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryQuery) params.set('category', categoryQuery);
    const qs = params.toString() ? `?${params.toString()}` : '';
    apiFetch(`/products/${qs}`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false));
  }, [searchQuery, categoryQuery]);

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

  const setCategory = (cat) => {
    if (cat.toLowerCase() === categoryQuery.toLowerCase()) {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat.toLowerCase() });
    }
  };

  const clearFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    navigate(`/products${next.toString() ? `?${next.toString()}` : ''}`);
  };

  const hasFilter = searchQuery || categoryQuery;
  const pageTitle = categoryQuery
    ? categoryQuery.charAt(0).toUpperCase() + categoryQuery.slice(1)
    : searchQuery
    ? `Results for "${searchQuery}"`
    : 'All Products';

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ margin: '0 0 4px' }}>{pageTitle}</h1>
        {!loading && (
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          onClick={() => setSearchParams({})}
          style={{
            padding: '5px 14px', borderRadius: 20,
            border: '1px solid #d1d5db',
            background: !categoryQuery ? '#a3e635' : '#fff',
            color: '#111', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
          }}
        >
          All
        </button>
        {CATEGORY_LABELS.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '5px 14px', borderRadius: 20,
              border: '1px solid #d1d5db',
              background: categoryQuery.toLowerCase() === cat.toLowerCase() ? '#a3e635' : '#fff',
              color: '#111', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active search tag */}
      {hasFilter && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
          {searchQuery && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#eff6ff', border: '1px solid #93c5fd',
              borderRadius: 20, padding: '3px 10px', fontSize: '0.8rem', fontWeight: 'bold',
            }}>
              Search: "{searchQuery}"
              <button
                onClick={() => clearFilter('search')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', padding: 0, color: '#374151' }}
                aria-label="Clear search"
              >×</button>
            </span>
          )}
          <button
            onClick={() => navigate('/products')}
            style={{ fontSize: '0.8rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear all
          </button>
        </div>
      )}

      {loading && <p style={{ color: '#666' }}>Loading products…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: 12, color: '#6b7280' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>No products found.</p>
          {hasFilter && (
            <p style={{ fontSize: '0.9rem' }}>
              Try a different search or{' '}
              <button
                onClick={() => navigate('/products')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', textDecoration: 'underline', fontSize: 'inherit' }}
              >
                browse all products
              </button>.
            </p>
          )}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {products.map(p => (
            <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <Link to={`/products/${p.id}`} style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
                {p.image ? (
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: 180, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                    No image
                  </div>
                )}
                {p.organic_status === 'ORGANIC' && (
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    background: '#a3e635', color: '#000',
                    fontSize: '0.7rem', fontWeight: 'bold',
                    padding: '2px 8px', borderRadius: 10,
                  }}>
                    Organic
                  </span>
                )}
              </Link>

              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>{p.category}</span>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{p.name}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', flex: 1 }}>{p.description}</p>
                {p.producer_name && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>by {p.producer_name}</p>
                )}
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
                    marginTop: 8, padding: '8px 0', borderRadius: 8,
                    border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                    backgroundColor: added[p.id] ? '#16a34a' : '#a3e635',
                    color: '#000', transition: 'background 0.2s',
                  }}
                >
                  {added[p.id] ? '✓ Added' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
