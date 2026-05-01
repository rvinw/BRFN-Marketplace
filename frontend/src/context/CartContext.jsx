import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiFetch } from "../utils/api";

const CartContext = createContext(null);

const isLoggedIn = () => !!localStorage.getItem("brfn_token");

// Normalise the API response shape to the same shape the rest of the
// app already uses: { id, name, price, unit, category, image, quantity }
function normalise(apiItems) {
  return apiItems.map((i) => ({
    id: i.id,
    name: i.name,
    price: parseFloat(i.price),
    unit: i.unit,
    category: i.category,
    image: i.image || null,
    quantity: i.quantity,
  }));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // ── Load cart on mount ────────────────────────────────────────────
  const loadCart = useCallback(async () => {
    if (isLoggedIn()) {
      try {
        const res = await apiFetch("/cart/");
        if (res.ok) {
          const data = await res.json();
          setItems(normalise(data.items));
          return;
        }
      } catch {
        /* fall through to localStorage */
      }
    }
    // Not logged in (or API failed) — use localStorage
    try {
      setItems(JSON.parse(localStorage.getItem("brfn_cart") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Persist to localStorage when not logged in
  useEffect(() => {
    if (!isLoggedIn()) {
      localStorage.setItem("brfn_cart", JSON.stringify(items));
    }
  }, [items]);

  // ── Add to cart ───────────────────────────────────────────────────
  const addToCart = async (product) => {
    if (isLoggedIn()) {
      try {
        const res = await apiFetch("/cart/items/", {
          method: "POST",
          body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        });
        if (res.ok) {
          const data = await res.json();
          setItems(normalise(data.items));
          return;
        }
      } catch {
        /* fall through to optimistic update */
      }
    }
    // Offline / not logged in — update local state only
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // ── Remove item ───────────────────────────────────────────────────
  const removeFromCart = async (id) => {
    if (isLoggedIn()) {
      try {
        const res = await apiFetch(`/cart/items/${id}/`, { method: "DELETE" });
        if (res.ok) {
          const data = await res.json();
          setItems(normalise(data.items));
          return;
        }
      } catch {
        /* fall through */
      }
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ── Update quantity (delta = +1 or -1) ───────────────────────────
  const updateQty = async (id, delta) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;

    if (isLoggedIn()) {
      try {
        const res =
          newQty <= 0
            ? await apiFetch(`/cart/items/${id}/`, { method: "DELETE" })
            : await apiFetch(`/cart/items/${id}/`, {
                method: "PATCH",
                body: JSON.stringify({ quantity: newQty }),
              });
        if (res.ok) {
          const data = await res.json();
          setItems(normalise(data.items));
          return;
        }
      } catch {
        /* fall through */
      }
    }
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  // ── Clear cart ────────────────────────────────────────────────────
  const clearCart = async () => {
    if (isLoggedIn()) {
      try {
        await apiFetch("/cart/", { method: "DELETE" });
      } catch {
        /* best effort */
      }
    }
    setItems([]);
    localStorage.removeItem("brfn_cart");
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
