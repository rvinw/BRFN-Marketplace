import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('brfn_cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('brfn_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);

      // SOLD OUT protection
      if (
        product.stock_status === "SOLD_OUT" ||
        product.is_available === false ||
        Number(product.stock_quantity) <= 0
      ) {
        return prev;
      }

      // Existing cart item
      if (existing) {

        // Max stock protection
        if (existing.quantity >= Number(product.stock_quantity)) {
          return prev;
        }

        return prev.map(i =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) =>
    setItems(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, delta) => {
    setItems(prev =>
      prev
        .map(item => {

          if (item.id !== id) {
            return item;
          }

          const newQty = item.quantity + delta;

          // minimum quantity = 1
          if (newQty < 1) {
            return null;
          }

          // maximum quantity = stock quantity
          if (
            item.stock_quantity !== undefined &&
            newQty > Number(item.stock_quantity)
          ) {
            return item;
          }

          return {
            ...item,
            quantity: newQty,
          };
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}