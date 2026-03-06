export default function NavBar({ onNavigate }) {
  const categories = [
    { label: "Add a Product", value: "add" },
    { label: "Products", value: "home" },
    { label: "Incoming Orders", value: "orders" },
    { label: "Previous Orders", value: "history" },
    { label: "Request Weekly Payout", value: "payout" },
    { label: "Community Engagement", value: "community" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <span className="navbar__title">Producer Dashboard</span>
        
        <div className="nav-buttons-container">
          {categories.map((c) => (
            <button 
              key={c.label} 
              className="navitem" 
              type="button"
              onClick={() => onNavigate(c.value)}
            >
              <span className="navitem__text">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}