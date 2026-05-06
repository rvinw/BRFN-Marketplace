import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/products");
    }
  };

  return (
    <form className="search" onSubmit={handleSearch}>
      <input
        className="search__input"
        placeholder="Search local products…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="search__btn" type="submit">
        Search
      </button>
    </form>
  );
}
