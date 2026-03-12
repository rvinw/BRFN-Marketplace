import { useState } from "react";
import { Link } from "react-router-dom";

const icons = {
  Vegetables: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 22V12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <path d="M12 12C12 12 7 10 5 6c4 0 7 2 7 6z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12C12 12 17 10 19 6c-4 0-7 2-7 6z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16C12 16 8 14.5 6 11c3.5 0 6 2 6 5z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Dairy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M8 3h8M7 3v2l-2 4v11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9l-2-4V3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 11h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  ),
  Bakery: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 8c0-2.5 2-4 7-4s7 1.5 7 4c0 1-1 2-1 2H6S5 9 5 8z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="4" y="10" width="16" height="5" rx="1" stroke="currentColor" strokeWidth="1.75"/>
      <path d="M6 15v3M18 15v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  ),
  Preserves: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="8" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.75"/>
      <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  ),
  Seasonal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  ),
  Meat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M14 10c3-3 4-7 2-9s-6-1-9 2C4 6 4 10 7 12l1 1-4 4a1 1 0 0 0 1.4 1.4l4-4 1 1c2 2 6 2 8-1s1-6-2-9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Producer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const categories = [
  { label: "Vegetables" },
  { label: "Dairy" },
  { label: "Bakery" },
  { label: "Preserves" },
  { label: "Seasonal" },
  { label: "Meat" },
];

export default function NavBar() {
  const [active, setActive] = useState(null);

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        {/* Render Category Links */}
        {categories.map((c) => (
          <Link
            key={c.label}
            to={`/products?category=${c.label.toLowerCase()}`}
            className={`navitem${active === c.label ? " navitem--active" : ""}`}
            onClick={() => setActive(active === c.label ? null : c.label)}
          >
            <span className="navitem__icon">
              {icons[c.label]}
            </span>
            <span className="navitem__text">{c.label}</span>
          </Link>
        ))}

        {/* Vertical Divider for separation */}
        <div style={{ width: '1px', background: '#e0e0e0', height: '24px', margin: '0 15px' }}></div>

        {/* Producer Dashboard Link */}
        <Link
          to="/dashboard/producer"
          className={`navitem${active === 'Producer' ? " navitem--active" : ""}`}
          onClick={() => setActive('Producer')}
          style={{ marginLeft: 'auto' }}
        >
          <span className="navitem__icon" style={{ color: '#2c5f2d' }}>
            {icons.Producer}
          </span>
          <span className="navitem__text" style={{ color: '#2c5f2d', fontWeight: 'bold' }}>
            Producer Hub
          </span>
        </Link>
      </div>
    </nav>
  );
}