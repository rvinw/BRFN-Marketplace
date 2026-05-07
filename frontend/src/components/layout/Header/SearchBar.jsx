import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';

export default function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get('search') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setValue(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch(`/products/?search=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results ?? []);
        setSuggestions(results.slice(0, 6));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submit = () => {
    setOpen(false);
    const q = value.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  const selectSuggestion = (product) => {
    setValue(product.name);
    setOpen(false);
    navigate(`/products?search=${encodeURIComponent(product.name)}`);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') setOpen(false);
  };

  const showDropdown = open && value.trim().length >= 2;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div className="search">
        <input
          className="search__input"
          placeholder="Search local products or producers"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          autoComplete="off"
        />
        <button className="search__btn" type="button" onClick={submit}>
          Search
        </button>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 2000,
          overflow: 'hidden',
        }}>
          {loading && (
            <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Searching…
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No products found for "{value.trim()}"
            </div>
          )}

          {!loading && suggestions.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => selectSuggestion(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 12,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {/* Category colour dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent)', opacity: 0.6,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  {p.category}{p.producer_name ? ` · ${p.producer_name}` : ''}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>
                  £{parseFloat(p.price).toFixed(2)}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 2 }}>
                  /{p.unit_amount}
                </span>
              </div>
            </button>
          ))}

          {!loading && suggestions.length > 0 && (
            <button
              type="button"
              onMouseDown={submit}
              style={{
                display: 'block',
                width: '100%',
                padding: '9px 16px',
                border: 'none',
                borderTop: '1px solid var(--border)',
                background: 'var(--cream)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--accent)',
                textAlign: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-deep)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--cream)'}
            >
              See all results for "{value.trim()}" →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
