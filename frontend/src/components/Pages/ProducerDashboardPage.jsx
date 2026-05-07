import { useEffect, useState } from "react";
import AddProductForm from "../sections/AddProductForm";
import CommunityEngagement from "../sections/CommunityEngagement";
import "./ProducerDashboardPage.css";
import FreshnessCheck from "../sections/FreshnessCheck";

export default function ProducerDashboardPage() {
  const [view, setView] = useState("home");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [payout, setPayout] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  const [myProducts, setMyProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  const menuItems = [
    { id: "home", label: "My Products" },
    { id: "add", label: "Add Product" },
    { id: "orders", label: "Incoming Orders" },
    { id: "history", label: "Previous Orders" },
    { id: "payout", label: "Weekly Payout" },
    { id: "community", label: "Community Engagement" },
  ];

  const getToken = () =>
    sessionStorage.getItem("brfn_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token");

  const formatQty = (value) => {
    const number = Number(value || 0);
    return Number.isInteger(number) ? number : number.toFixed(2);
  };

  const fetchIncomingOrders = async () => {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const token = getToken();

      if (!token) {
        setOrdersError("No login token found. Please log in again.");
        setOrders([]);
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/producer/orders/incoming/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOrdersError(
          data.error || data.detail || "Failed to load incoming orders."
        );
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Incoming orders error:", error);
      setOrdersError("Could not connect to backend.");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchWeeklyPayout = async () => {
    setPayoutLoading(true);
    setPayoutError("");

    try {
      const token = getToken();

      if (!token) {
        setPayoutError("No login token found. Please log in again.");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/producer/weekly-payout/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPayoutError(data.error || data.detail || "Failed to load payout.");
        return;
      }

      setPayout(data);
    } catch (error) {
      console.error("Weekly payout error:", error);
      setPayoutError("Could not connect to backend.");
    } finally {
      setPayoutLoading(false);
    }
  };

  const updateItemStatus = async (itemId, status) => {
    try {
      const token = getToken();

      if (!token) {
        alert("No login token found. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/producer/order-items/${itemId}/status/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || data.detail || "Failed to update item.");
        return;
      }

      fetchIncomingOrders();
    } catch (error) {
      console.error("Update item error:", error);
      alert("Error updating item.");
    }
  };

  const updateItemAvailability = async (
    itemId,
    fulfilledQuantity,
    availabilityNote
  ) => {
    try {
      const token = getToken();

      if (!token) {
        alert("No login token found. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/producer/order-items/${itemId}/availability/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fulfilled_quantity: fulfilledQuantity,
            availability_note: availabilityNote,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || data.detail || "Failed to update availability.");
        return;
      }

      fetchIncomingOrders();
    } catch (error) {
      console.error("Update availability error:", error);
      alert("Error updating availability.");
    }
  };

  const getPrepareBy = (placedAt) => {
    const placedDate = new Date(placedAt);
    return new Date(placedDate.getTime() + 48 * 60 * 60 * 1000);
  };

  const getCountdown = (placedAt) => {
    const prepareBy = getPrepareBy(placedAt);
    const now = new Date();
    const diff = prepareBy - now;

    if (diff <= 0) {
      return "Lead time exceeded";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${hours}h ${minutes}m remaining`;
  };

  const fetchMyProducts = async () => {
  setProductsLoading(true);
  setProductsError("");

  try {
    const token = getToken();

    const response = await fetch("http://localhost:8000/api/producer/my-products/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      setProductsError(data.error || data.detail || "Failed to load products.");
      setMyProducts([]);
      return;
    }

    setMyProducts(data);
  } catch (error) {
    console.error("My products error:", error);
    setProductsError("Could not connect to backend.");
  } finally {
    setProductsLoading(false);
  }
};

const updateProductStock = async (productId) => {
  const input = document.getElementById(`stock-${productId}`);
  const stockQuantity = input.value;

  try {
    const token = getToken();

    const response = await fetch(
      `http://localhost:8000/api/producer/products/${productId}/stock/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stock_quantity: stockQuantity,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || data.detail || "Failed to update stock.");
      return;
    }

    fetchMyProducts();
  } catch (error) {
    console.error("Update stock error:", error);
    alert("Error updating stock.");
  }
};

const removeProductFromSale = async (productId) => {
  if (!window.confirm("Remove this product from customer sale?")) {
    return;
  }

  try {
    const token = getToken();

    const response = await fetch(
      `http://localhost:8000/api/producer/products/${productId}/remove/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || data.detail || "Failed to remove product.");
      return;
    }

    fetchMyProducts();
  } catch (error) {
    console.error("Remove product error:", error);
    alert("Error removing product.");
  }
};

  useEffect(() => {
  if (view === "home") {
    fetchMyProducts();
  }

  if (view === "orders") {
    fetchIncomingOrders();
  }

  if (view === "payout") {
    fetchWeeklyPayout();
  }
}, [view]);

  return (
    <div className="main-container">
      <FreshnessCheck />
      <nav className="dashboard-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={
              view === item.id ? "dashboard-tab active" : "dashboard-tab"
            }
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="producer-content-area">
        {view === "home" && (
          <div className="my-products-page">
            <h1 className="my-products-title">My Product Inventory</h1>

            {productsLoading && (
              <p className="incoming-orders-message">Loading your products...</p>
            )}

            {productsError && (
              <p className="incoming-orders-error">{productsError}</p>
            )}

            {!productsLoading && !productsError && myProducts.length === 0 && (
              <p className="incoming-orders-message">
                You have not added any products yet.
              </p>
            )}

            {!productsLoading && !productsError && myProducts.length > 0 && (
              <div className="my-products-grid">
                {myProducts.map((product) => {
                  const soldOut =
                    product.stock_status === "SOLD_OUT" ||
                    product.is_available === false ||
                    Number(product.stock_quantity) <= 0;

                  return (
                    <div key={product.id} className="my-product-card">
                      <div className="my-product-header">
                        <div>
                          <h2>{product.product_name}</h2>
                          <p>{product.category}</p>
                        </div>

                        <span
                          className={
                            soldOut
                              ? "product-stock-badge sold-out"
                              : "product-stock-badge in-stock"
                          }
                        >
                          {soldOut ? "Sold Out" : "Available"}
                        </span>
                      </div>

                      <div className="my-product-info">
                        <div>
                          <span>Price</span>
                          <strong>£{product.current_price}</strong>
                        </div>

                        <div>
                          <span>Unit</span>
                          <strong>{product.product_unit}</strong>
                        </div>

                        <div>
                          <span>Current Stock</span>
                          <strong>{parseInt(product.stock_quantity)}</strong>
                        </div>
                      </div>

                      <div className="stock-edit-row">
                        <label>
                          New Stock Quantity
                          <input
                            id={`stock-${product.id}`}
                            type="number"
                            min="0"
                            step="1"
                            defaultValue={parseInt(product.stock_quantity)}
                          />
                        </label>

                        <button
                          className="update-stock-btn"
                          onClick={() => updateProductStock(product.id)}
                        >
                          Update Stock
                        </button>

                        <button
                          className="remove-product-btn"
                          onClick={() => removeProductFromSale(product.id)}
                        >
                          Remove from Sale
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === "add" && (
          <div className="form-container">
            <h1>Add New Product</h1>
            <AddProductForm onNavigate={setView} />
          </div>
        )}

        {view === "orders" && (
          <div className="incoming-orders-page">
            <h1 className="incoming-orders-title">Incoming Orders</h1>

            {ordersLoading && (
              <p className="incoming-orders-message">
                Loading incoming orders...
              </p>
            )}

            {ordersError && (
              <p className="incoming-orders-error">{ordersError}</p>
            )}

            {!ordersLoading && !ordersError && orders.length === 0 && (
              <p className="incoming-orders-message">No incoming orders yet.</p>
            )}

            {!ordersLoading &&
              !ordersError &&
              orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <h2>Order #{order.order_id}</h2>
                      <p className="order-subtitle">
                        Customer: {order.customer_email}
                      </p>

                      <div className="lead-time-box">
                        <p>
                          <strong>Lead Time:</strong> 48 hours
                        </p>

                        <p>
                          <strong>Prepare By:</strong>{" "}
                          {getPrepareBy(order.placed_at).toLocaleString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>

                        <p className="countdown-text">
                          ⏳ {getCountdown(order.placed_at)}
                        </p>
                      </div>
                    </div>

                    <span className={`order-status ${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-info-grid">
                    <div>
                      <span className="order-label">Postcode</span>
                      <p>{order.delivery_postcode}</p>
                    </div>

                    <div>
                      <span className="order-label">Items</span>
                      <p>{order.items?.length || 0}</p>
                    </div>
                  </div>

                  <h3 className="order-items-title">Order Items</h3>

                  <div className="order-items-list">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <div key={item.id} className="order-item">
                          <div className="order-item-top">
                            <span className="product-name">
                              {item.product_name}
                            </span>

                            <div className="item-meta">
                              <span>Ordered: {formatQty(item.quantity)}</span>
                              <span>
                                Fulfilled:{" "}
                                {formatQty(
                                  item.fulfilled_quantity ?? item.quantity
                                )}
                              </span>
                              <strong>£{item.total_cost}</strong>
                            </div>
                          </div>

                          <div className="availability-editor">
                            <div className="availability-field fulfilled-field">
                              <label htmlFor={`qty-${item.id}`}>
                                Fulfilled Qty
                              </label>
                              <input
                                id={`qty-${item.id}`}
                                type="number"
                                min="0"
                                max={parseInt(item.quantity)}
                                step="1"
                                defaultValue={formatQty(
                                  item.fulfilled_quantity ?? item.quantity
                                )}
                              />
                            </div>

                            <div className="availability-field note-field">
                              <label htmlFor={`note-${item.id}`}>
                                Availability Note
                              </label>
                              <input
                                id={`note-${item.id}`}
                                type="text"
                                placeholder="e.g. Partial stock available"
                                defaultValue={item.availability_note || ""}
                              />
                            </div>

                            <button
                              className="update-availability-btn"
                              onClick={() => {
                                const qty = document.getElementById(
                                  `qty-${item.id}`
                                ).value;
                                const note = document.getElementById(
                                  `note-${item.id}`
                                ).value;

                                updateItemAvailability(item.id, qty, note);
                              }}
                            >
                              Update Availability
                            </button>
                          </div>

                          {item.availability_note && (
                            <p className="availability-note">
                              Note: {item.availability_note}
                            </p>
                          )}

                          <div className="order-item-actions">
                            <span
                              className={`item-status ${item.status?.toLowerCase()}`}
                            >
                              {item.status}
                            </span>

                            {item.status === "PENDING" && (
                              <button
                                className="confirm-item-btn"
                                onClick={() =>
                                  updateItemStatus(item.id, "CONFIRMED")
                                }
                              >
                                Confirm
                              </button>
                            )}

                            {item.status === "CONFIRMED" && (
                              <button
                                className="ready-item-btn"
                                onClick={() =>
                                  updateItemStatus(item.id, "READY")
                                }
                              >
                                Mark Ready
                              </button>
                            )}

                            {item.status === "READY" && (
                              <button
                                className="delivered-item-btn"
                                onClick={() =>
                                  updateItemStatus(item.id, "DELIVERED")
                                }
                              >
                                Delivered
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No items found for this order.</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {view === "history" && (
          <div className="producer-card">
            <h1 className="page-title">Order History</h1>
            <p>View your completed sales and past transactions.</p>
          </div>
        )}

        {view === "payout" && (
          <div className="payout-page">
            <h1 className="payout-title">Weekly Payout</h1>

            {payoutLoading && (
              <p className="incoming-orders-message">Loading payout...</p>
            )}

            {payoutError && (
              <p className="incoming-orders-error">{payoutError}</p>
            )}

            {!payoutLoading && !payoutError && payout && (
              <div className="payout-card">
                <p>
                  <strong>Week:</strong> {payout.week_start} to{" "}
                  {payout.week_end}
                </p>

                <div className="payout-summary">
                  <div>
                    <span>Gross Earnings</span>
                    <strong>£{payout.gross_amount}</strong>
                  </div>

                  <div>
                    <span>BRFN Commission 5%</span>
                    <strong>£{payout.commission_amount}</strong>
                  </div>

                  <div>
                    <span>Net Payout</span>
                    <strong>£{payout.net_amount}</strong>
                  </div>
                </div>

                <p>
                  <strong>Status:</strong> {payout.request_status}
                </p>

                {payout.request_status === "NOT_REQUESTED" && (
                  <button
                    className="request-payout-btn"
                    onClick={async () => {
                      const response = await fetch(
                        "http://localhost:8000/api/producer/weekly-payout/",
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${getToken()}`,
                            "Content-Type": "application/json",
                          },
                        }
                      );

                      const data = await response.json();

                      if (!response.ok) {
                        alert(data.error || "Failed to request payout.");
                        return;
                      }

                      fetchWeeklyPayout();
                    }}
                  >
                    Request Payout
                  </button>
                )}

                {payout.request_status === "PENDING" && (
                  <p className="payout-requested">
                    ⏳ Payout request submitted — awaiting BRFN approval.
                  </p>
                )}

                {payout.request_status === "PAID" && (
                  <p className="payout-requested payout-paid">
                    ✓ Payout has been paid out to you.
                  </p>
                )}

                <h2>Delivered Items Included</h2>

                {payout.items.length === 0 ? (
                  <p>No delivered items for this week yet.</p>
                ) : (
                  payout.items.map((item) => (
                    <div key={item.id} className="payout-item">
                      <span>{item.product_name}</span>
                      <span>Qty: {formatQty(item.quantity)}</span>
                      <strong>£{item.total_cost}</strong>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {view === "community" && (
          <div className="community-view-wrapper">
            <CommunityEngagement />
          </div>
        )}
      </main>
    </div>
  );
}