import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { usePostcode } from "../../../context/PostcodeContext";
import SearchBar from "./SearchBar";

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13V7m0 13 6-3M9 7l6-3m0 17 5.447-2.724A1 1 0 0 0 21 17.382V6.618a1 1 0 0 0-1.447-.894L15 8m0 13V8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DASHBOARD_ROUTES = {
  customer: '/dashboard/customer',
  producer: '/dashboard/producer',
  admin:    '/dashboard/producer',
};

export default function TopBar() {
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { clearCart } = useCart();
  const { postcode, savePostcode } = usePostcode();
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    clearCart();
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="topbar">
      {/* Left */}
      <div className="topbar_left">
        <Link to="/" className="topbar_logo">BRFN Marketplace</Link>
      </div>

      {/* Center */}
      <div className={`topbar_center ${postcodeOpen ? "topbar_center--compact" : ""}`}>
        <SearchBar />
      </div>

      {/* Right */}
      <div className="topbar_right">
        <Link to="/map" className="topbar-btn">
          <MapIcon />
          Producer Map
        </Link>

        {!postcodeOpen ? (
          <button
            className="postcode-chip"
            type="button"
            onClick={() => { setDraft(postcode); setPostcodeOpen(true); }}
          >
            <span className="postcode-chip__icon"><PinIcon /></span>
            {postcode || 'Enter postcode'}
          </button>
        ) : (
          <div className="postcode-edit">
            <span className="postcode-chip__icon"><PinIcon /></span>
            <input
              className="postcode-input"
              placeholder="e.g. BS1 5XX"
              type="text"
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { savePostcode(draft); setPostcodeOpen(false); }
                if (e.key === 'Escape') setPostcodeOpen(false);
              }}
            />
            <button
              className="postcode-save"
              type="button"
              onClick={() => { savePostcode(draft); setPostcodeOpen(false); }}
            >
              Save
            </button>
          </div>
        )}

        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              className="topbar-btn"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <UserIcon />
              {user.name}
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%',
                background: '#fff', border: '1px solid #e0e0e0',
                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '160px', zIndex: 100,
              }}>
                <Link
                  to={DASHBOARD_ROUTES[user.role]}
                  style={{ display: 'block', padding: '10px 16px', textDecoration: 'none', color: '#333' }}
                  onClick={() => setMenuOpen(false)}
                >
                  My Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#c0392b',
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="topbar-btn">
            <UserIcon />
            Login
          </Link>
        )}

        <Link to="/cart" className="topbar-btn topbar-btn--primary">
          <CartIcon />
          Cart
        </Link>
      </div>
    </div>
  );
}

