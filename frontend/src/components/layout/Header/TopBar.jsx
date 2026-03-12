import { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>
  </svg>
);

const CartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

export default function TopBar() {
  const [postcodeOpen, setPostcodeOpen] = useState(false);

  return (
    <div className="topbar">
      {/* Left */}
      <div className="topbar_left">
        <Link to="/" className="topbar_logo">BRFN Marketplace</Link>  {/* 👈 logo now links home */}
      </div>

      {/* Center */}
      <div className={`topbar_center ${postcodeOpen ? "topbar_center--compact" : ""}`}>
        <SearchBar />
      </div>

      {/* Right */}
      <div className="topbar_right">
        {!postcodeOpen ? (
          <button
            className="postcode-chip"
            type="button"
            onClick={() => setPostcodeOpen(true)}
          >
            <span className="postcode-chip__icon"><PinIcon /></span>
            Enter postcode
          </button>
        ) : (
          <div className="postcode-edit">
            <span className="postcode-chip__icon"><PinIcon /></span>
            <input
              className="postcode-input"
              placeholder="e.g. BS1 5XX"
              type="text"
              autoFocus
            />
            <button
              className="postcode-save"
              type="button"
              onClick={() => setPostcodeOpen(false)}
            >
              Save
            </button>
          </div>
        )}

        <Link to="/login" className="topbar-btn">          {/* 👈 was <button> */}
          <UserIcon />
          Login
        </Link>

        <Link to="/cart" className="topbar-btn topbar-btn--primary">  {/* 👈 was <button> */}
          <CartIcon />
          Cart
        </Link>
      </div>
    </div>
  );
}