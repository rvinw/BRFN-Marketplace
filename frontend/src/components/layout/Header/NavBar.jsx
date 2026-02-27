export default function NavBar() {
  const categories = [
    { label: "Vegetables", icon: "🥕" },
    { label: "Dairy", icon: "🥛" },
    { label: "Bakery", icon: "🍞" },
    { label: "Preserves", icon: "🍯" },
    { label: "Seasonal", icon: "🌞" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        {categories.map((c) => (
          <button key={c.label} className="navitem" type="button">
            <span className="navitem__icon">{c.icon}</span>
            <span className="navitem__text">{c.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}