import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { apiFetch } from "../../utils/api";
import "./ProductsPage.css";

const CATEGORY_LABELS = [
  "Vegetables",
  "Dairy",
  "Bakery",
  "Preserves",
  "Seasonal",
  "Meat",
];

export default function ProductsPage() {
  const { addToCart, items } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState({});
  const [search, setSearch] = useState("");

  const activeCategory = searchParams.get("category") || "";

  useEffect(() => {
    apiFetch("/products/")
      .then((r) => r.json())
      .then((data) =>
        setProducts(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch(() => setError("Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let out = products;
    if (activeCategory) {
      out = out.filter(
        (p) => p.category?.toLowerCase() === activeCategory.toLowerCase(),
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      );
    }
    return out;
  }, [products, activeCategory, search]);

  const handleAdd = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      unit: product.unit_amount,
      category: product.category,
      image: product.image || null,
    });
    setAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(
      () => setAdded((prev) => ({ ...prev, [product.id]: false })),
      1500,
    );
  };

  const cartCount = (id) => {
    const item = items.find((i) => i.id === id);
    return item ? item.quantity : 0;
  };

  const setCategory = (cat) => {
    if (cat.toLowerCase() === activeCategory.toLowerCase()) {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat.toLowerCase() });
    }
  };

  const activeCategoryLabel = CATEGORY_LABELS.find(
    (c) => c.toLowerCase() === activeCategory.toLowerCase(),
  );

  return (
    <div className="products-page">
      {/* ── Page header ── */}
      <div className="products-page__header">
        <div>
          <h1 className="products-page__title">
            {activeCategoryLabel ? activeCategoryLabel : "All Products"}
          </h1>
          <p className="products-page__subtitle">
            {loading
              ? "Loading…"
              : activeCategoryLabel
                ? `${filtered.length} ${activeCategoryLabel.toLowerCase()} product${filtered.length !== 1 ? "s" : ""}`
                : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} from local producers`}
          </p>
        </div>

        <div className="products-page__search-wrap">
          <input
            className="products-page__search"
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category filter pills ── */}
      <div className="products-page__filters">
        <button
          className={`filter-pill ${!activeCategory ? "filter-pill--active" : ""}`}
          onClick={() => {
            setSearchParams({});
          }}
        >
          All
        </button>
        {CATEGORY_LABELS.map((cat) => (
          <button
            key={cat}
            className={`filter-pill ${activeCategory.toLowerCase() === cat.toLowerCase() ? "filter-pill--active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── States ── */}
      {loading && <p className="products-page__state">Loading products…</p>}
      {error && (
        <p className="products-page__state products-page__state--error">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="products-page__empty">
          <p>
            No products found
            {activeCategoryLabel ? ` in ${activeCategoryLabel}` : ""}.
          </p>
          {activeCategory && (
            <button
              className="filter-pill filter-pill--active"
              style={{ marginTop: "1rem" }}
              onClick={() => setSearchParams({})}
            >
              View all products
            </button>
          )}
        </div>
      )}

      {/* ── Product grid ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="products-grid">
          {filtered.map((p) => (
            <div key={p.id} className="product-card">
              <Link
                to={`/products/${p.id}`}
                className="product-card__image-wrap"
              >
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="product-card__image"
                  />
                ) : (
                  <div className="product-card__image product-card__image--placeholder">
                    <span>No image</span>
                  </div>
                )}
                {p.organic_status === "ORGANIC" && (
                  <span className="product-card__badge">Organic</span>
                )}
              </Link>

              <div className="product-card__body">
                <span className="product-card__category">{p.category}</span>
                <h3 className="product-card__name">{p.name}</h3>
                <p className="product-card__desc">{p.description}</p>

                {p.producer_name && (
                  <p className="product-card__producer">by {p.producer_name}</p>
                )}

                <div className="product-card__footer">
                  <div className="product-card__price-row">
                    <span className="product-card__price">
                      £{parseFloat(p.price).toFixed(2)}
                    </span>
                    <span className="product-card__unit">
                      / {p.unit_amount}
                    </span>
                  </div>
                  {cartCount(p.id) > 0 && (
                    <span className="product-card__in-cart">
                      × {cartCount(p.id)} in cart
                    </span>
                  )}
                </div>

                <button
                  className={`product-card__btn ${added[p.id] ? "product-card__btn--added" : ""}`}
                  onClick={() => handleAdd(p)}
                >
                  {added[p.id] ? "✓ Added" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
