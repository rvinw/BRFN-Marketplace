import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./CartPage.css";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQty, removeFromCart } = useCart();

  const formatStock = (value) => parseInt(value || 0, 10);

  const isSoldOut = (item) => {
    return (
      item.stock_status === "SOLD_OUT" ||
      item.is_available === false ||
      Number(item.stock_quantity) <= 0
    );
  };

  const isOverStock = (item) => {
    if (item.stock_quantity === undefined || item.stock_quantity === null) {
      return false;
    }

    return Number(item.quantity) > Number(item.stock_quantity);
  };

  const hasInvalidItems = items.some((item) => isSoldOut(item) || isOverStock(item));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = subtotal > 25 ? 0 : 3.99;
  const total = subtotal + delivery;

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Your Cart</h1>
        <p>
          {items.length} {items.length === 1 ? "item" : "items"} from local
          producers
        </p>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <h2>Your basket is empty</h2>
              <p>Discover fresh produce from local farmers and makers.</p>
              <button
                className="btn-primary"
                onClick={() => navigate("/products")}
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map((item) => {
              const soldOut = isSoldOut(item);
              const overStock = isOverStock(item);

              return (
                <div
                  className={`cart-item ${
                    soldOut || overStock ? "cart-item--warning" : ""
                  }`}
                  key={item.id}
                >
                  {item.image && (
                    <img
                      className="cart-item__img"
                      src={item.image}
                      alt={item.name}
                    />
                  )}

                  <div className="cart-item__info">
                    <h3 className="cart-item__name">{item.name}</h3>

                    {(item.producer || item.producer_name) && (
                      <p className="cart-item__producer">
                        {item.producer || item.producer_name}
                      </p>
                    )}

                    <div className="cart-item__badges">
                      {item.category && (
                        <span className="badge badge--category">
                          {item.category}
                        </span>
                      )}

                      {item.organic && (
                        <span className="badge badge--organic">Organic</span>
                      )}

                      {soldOut ? (
                        <span className="badge badge--sold-out">Sold Out</span>
                      ) : (
                        <span className="badge badge--stock">
                          In stock: {formatStock(item.stock_quantity)}
                        </span>
                      )}
                    </div>

                    {overStock && (
                      <p className="stock-warning">
                        Only {formatStock(item.stock_quantity)} available.
                        Please reduce the quantity.
                      </p>
                    )}

                    {soldOut && (
                      <p className="stock-warning">
                        This item is currently sold out. Please remove it from
                        your basket.
                      </p>
                    )}
                  </div>

                  <div className="cart-item__actions">
                    <span className="cart-item__price">
                      £{(item.price * item.quantity).toFixed(2)}
                    </span>

                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        −
                      </button>

                      <span className="qty-value">{item.quantity}</span>

                      <button
                        className="qty-btn"
                        disabled={
                          soldOut ||
                          Number(item.quantity) >= Number(item.stock_quantity)
                        }
                        onClick={() => updateQty(item.id, +1)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <span>{delivery === 0 ? "Free" : `£${delivery.toFixed(2)}`}</span>
          </div>

          {delivery > 0 && (
            <div className="free-delivery-note">
              Add £{(25 - subtotal).toFixed(2)} more for free delivery
            </div>
          )}

          <div className="summary-row summary-row--total">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>

          {hasInvalidItems && (
            <p className="checkout-warning">
              Some items are sold out or exceed available stock. Please update
              your basket before checkout.
            </p>
          )}

          <button
            className="checkout-btn"
            disabled={items.length === 0 || hasInvalidItems}
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>

          <button
            className="continue-link"
            onClick={() => navigate("/products")}
          >
            ← Continue shopping
          </button>

          <p className="producer-note">
            Items may be fulfilled by multiple local producers. Delivery dates
            will be confirmed at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}