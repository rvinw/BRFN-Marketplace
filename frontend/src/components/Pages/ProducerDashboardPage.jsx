import { useEffect, useState } from "react";
import AddProductForm from "../sections/AddProductForm";
import CommunityEngagement from "../sections/CommunityEngagement";
import "./ProducerDashboardPage.css";

export default function ProducerDashboardPage() {
  const [view, setView] = useState("home");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [editProduct, setEditProduct] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [payout, setPayout] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [notifications, setNotifications] = useState([]);

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

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const res = await fetch("http://localhost:8000/api/producer/products/", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) { setProductsError(data.error || "Failed to load products."); return; }
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProductsError("Could not connect to backend.");
    } finally {
      setProductsLoading(false);
    }
  };

  const toggleAvailability = async (product) => {
    const res = await fetch(`http://localhost:8000/api/producer/products/${product.id}/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !product.is_available }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    }
  };

  const saveProductEdit = async () => {
    const res = await fetch(`http://localhost:8000/api/producer/products/${editProduct.id}/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        price: editProduct.price,
        stock_quantity: editProduct.stock_quantity,
        description: editProduct.description,
      }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));

    if (editProduct.discountPercentage && editProduct.dealExpiresAt) {
      await fetch(`http://localhost:8000/api/producer/products/${editProduct.id}/deals/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          discount_percentage: editProduct.discountPercentage,
          expires_at: editProduct.dealExpiresAt,
        }),
      });
    }

    if (editProduct.availabilityType) {
      await fetch(`http://localhost:8000/api/producer/products/${editProduct.id}/availability/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          availability_type: editProduct.availabilityType,
          start_month: editProduct.startMonth || null,
          end_month: editProduct.endMonth || null,
        }),
      });
    }
    setEditProduct(null);
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await fetch(`http://localhost:8000/api/producer/products/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) setProducts(prev => prev.filter(p => p.id !== id));
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
    const token =
      sessionStorage.getItem("brfn_token") ||
      localStorage.getItem("access") ||
      localStorage.getItem("token");

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
      setPayoutError(data.error || "Failed to load payout.");
      return;
    }

    setPayout(data);

  } catch (error) {
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
      alert("Error updating item.");
    }
  };

  const updateItemAvailability = async (itemId, fulfilledQuantity, availabilityNote) => {
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
    alert("Error updating availability.");
  }
};

  const getPrepareBy = (placedAt) => {
    const placedDate = new Date(placedAt);

    return new Date(
      placedDate.getTime() + 48 * 60 * 60 * 1000
    );
  };

  const getCountdown = (placedAt) => {
    const prepareBy = getPrepareBy(placedAt);

    const now = new Date();

    const diff = prepareBy - now;

    if (diff <= 0) {
      return "Lead time exceeded";
    }

    const hours = Math.floor(
      diff / (1000 * 60 * 60)
    );

    const minutes = Math.floor(
      (diff / (1000 * 60)) % 60
    );

    return `${hours}h ${minutes}m remaining`;
  };

  const activeOrders = orders.filter(o => !["DELIVERED", "CANCELLED"].includes(o.status));
  const completedOrders = orders.filter(o => ["DELIVERED", "CANCELLED"].includes(o.status));

  const fetchNotifications = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch("http://localhost:8000/api/producer/notifications/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data.filter(n => !n.is_read) : []);
    } catch (err) {
      console.error("Notifications error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (view === "home") fetchProducts();
    if (view === "orders" || view === "history") fetchIncomingOrders();
    if (view === "payout") fetchWeeklyPayout();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [view]);

  return (
    <div className="main-container">
      {notifications.length > 0 && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 6, padding: "12px 16px", margin: "16px", position: "relative" }}>
          <button
            onClick={async () => {
              const token = getToken();
              await Promise.all(notifications.map(n =>
                fetch(`http://localhost:8000/api/producer/notifications/${n.id}/read/`, {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${token}` },
                })
              ));
              setNotifications([]);
            }}
            style={{ position: "absolute", top: 8, right: 12, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#666" }}
          >✕</button>
          <strong>Low Stock Alerts</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            {notifications.map(n => (
              <li key={n.id}>{n.message}</li>
            ))}
          </ul>
        </div>
      )}
      <nav className="dashboard-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id);
              if (item.id === "home") fetchProducts();
              if (item.id === "orders" || item.id === "history") fetchIncomingOrders();
              if (item.id === "payout") fetchWeeklyPayout();
            }}
            className={view === item.id ? "dashboard-tab active" : "dashboard-tab"}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="producer-content-area">
        {view === "home" && (
          <div className="incoming-orders-page">
            <h1 className="incoming-orders-title">My Product Inventory</h1>

            {productsLoading && <p className="incoming-orders-message">Loading products...</p>}
            {productsError && <p className="incoming-orders-error">{productsError}</p>}

            {!productsLoading && !productsError && products.length === 0 && (
              <p className="incoming-orders-message">
                No products yet. Use <strong>Add Product</strong> to list your first item.
              </p>
            )}

            {!productsLoading && !productsError && products.map(p => (
              <div key={p.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <h2>{p.name}</h2>
                    <p className="order-subtitle">{p.category} · {p.unit_amount}</p>
                  </div>
                  <span className="order-status" style={{
                    background: p.is_available ? "#dcfce7" : "#fee2e2",
                    color: p.is_available ? "#166534" : "#991b1b",
                    padding: "4px 12px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700,
                  }}>
                    {p.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="order-info-grid">
                  <div><span className="order-label">Price</span><p>£{parseFloat(p.price).toFixed(2)} / {p.unit_amount}</p></div>
                  <div><span className="order-label">Stock</span>
                    <p style={{ color: parseFloat(p.stock_quantity) <= 5 ? "#dc2626" : "inherit", fontWeight: parseFloat(p.stock_quantity) <= 5 ? 700 : 400 }}>
                      {parseFloat(p.stock_quantity)} {parseFloat(p.stock_quantity) <= 5 && "⚠ Low"}
                    </p>
                  </div>
                  <div><span className="order-label">Organic</span><p>{p.organic_status === "ORGANIC" ? "✓ Organic" : "Non-organic"}</p></div>
                  {p.harvest_date && <div><span className="order-label">Harvest</span><p>{new Date(p.harvest_date).toLocaleDateString("en-GB")}</p></div>}
                </div>

                {p.description && <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#555" }}>{p.description}</p>}

                <div className="order-item-actions" style={{ marginTop: 12 }}>
                  <button className="confirm-item-btn" onClick={() => setEditProduct({ ...p })}>Edit</button>
                  <button
                    className={p.is_available ? "cancel-item-btn" : "confirm-item-btn"}
                    onClick={() => toggleAvailability(p)}
                  >
                    {p.is_available ? "Mark Unavailable" : "Mark Available"}
                  </button>
                  <button className="cancel-item-btn" onClick={() => deleteProduct(p.id)}>Delete</button>
                </div>
              </div>
            ))}

            {editProduct && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "#fff", borderRadius: 12, padding: 32, width: "90%", maxWidth: 420 }}>
                  <h3 style={{ margin: "0 0 20px" }}>Edit — {editProduct.name}</h3>
                  <label style={{ display: "block", marginBottom: 12, fontWeight: 600, fontSize: "0.9rem" }}>
                    Price (£)
                    <input type="number" step="0.01" value={editProduct.price}
                      onChange={e => setEditProduct(p => ({ ...p, price: e.target.value }))}
                      style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 12, fontWeight: 600, fontSize: "0.9rem" }}>
                    Stock Quantity
                    <input type="number" step="0.001" value={editProduct.stock_quantity}
                      onChange={e => setEditProduct(p => ({ ...p, stock_quantity: e.target.value }))}
                      style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 20, fontWeight: 600, fontSize: "0.9rem" }}>
                    Description
                    <textarea value={editProduct.description || ""}
                      onChange={e => setEditProduct(p => ({ ...p, description: e.target.value }))}
                      rows={3}
                      style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", marginTop: 4, resize: "vertical", fontFamily: "inherit" }} />
                  </label>
                  <hr style={{ margin: "0 0 16px", border: "none", borderTop: "1px solid #eee" }} />
                  <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "0.9rem" }}>Seasonal Availability</p>
                  <label style={{ display: "block", marginBottom: 12, fontWeight: 600, fontSize: "0.9rem" }}>
                    Availability Type
                    <select value={editProduct.availabilityType || ""}
                      onChange={e => setEditProduct(p => ({ ...p, availabilityType: e.target.value }))}
                      style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}>
                      <option value="">-- Select --</option>
                      <option value="YEAR_ROUND">Year Round</option>
                      <option value="SEASONAL">Seasonal</option>
                    </select>
                  </label>
                  {editProduct.availabilityType === "SEASONAL" && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                      <label style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem" }}>
                        Start Month
                        <input type="number" min="1" max="12" placeholder="1-12" value={editProduct.startMonth || ""}
                          onChange={e => setEditProduct(p => ({ ...p, startMonth: e.target.value }))}
                          style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }} />
                      </label>
                      <label style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem" }}>
                        End Month
                        <input type="number" min="1" max="12" placeholder="1-12" value={editProduct.endMonth || ""}
                          onChange={e => setEditProduct(p => ({ ...p, endMonth: e.target.value }))}
                          style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }} />
                      </label>
                    </div>
                  )}
                  <hr style={{ margin: "0 0 16px", border: "none", borderTop: "1px solid #eee" }} />
                  <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "0.9rem" }}>Discount Deal</p>
                  <label style={{ display: "block", marginBottom: 12, fontWeight: 600, fontSize: "0.9rem" }}>
                    Discount %
                    <input type="number" min="1" max="100" placeholder="e.g. 20" value={editProduct.discountPercentage || ""}
                      onChange={e => setEditProduct(p => ({ ...p, discountPercentage: e.target.value }))}
                      style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }} />
                  </label>
                  <label style={{ display: "block", marginBottom: 20, fontWeight: 600, fontSize: "0.9rem" }}>
                    Deal Expires At
                    <input type="datetime-local" value={editProduct.dealExpiresAt || ""}
                      onChange={e => setEditProduct(p => ({ ...p, dealExpiresAt: e.target.value }))}
                      style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }} />
                  </label>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button className="cancel-item-btn" onClick={() => setEditProduct(null)}>Cancel</button>
                    <button className="cancel-item-btn" onClick={async () => {
                      await fetch(`http://localhost:8000/api/producer/products/${editProduct.id}/deals/`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ discount_percentage: 0 }),
                      });
                      setEditProduct(null);
                      fetchProducts();
                    }}>Remove Discount</button>
                    <button className="confirm-item-btn" onClick={saveProductEdit}>Save</button>
                  </div>
                </div>
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
              <p className="incoming-orders-message">Loading incoming orders...</p>
            )}

            {ordersError && (
              <p className="incoming-orders-error">{ordersError}</p>
            )}

            {!ordersLoading && !ordersError && activeOrders.length === 0 && (
              <p className="incoming-orders-message">No active orders right now. Completed orders appear in Previous Orders.</p>
            )}

            {!ordersLoading &&
              !ordersError &&
              activeOrders.map((order) => (
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
                          {getPrepareBy(order.placed_at).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <p className="countdown-text">
                          ⏳ {getCountdown(order.placed_at)}
                        </p>
                      </div>
                    </div>

                    <span className="order-status">{order.status}</span>
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
                            <span className="product-name">{item.product_name}</span>

                            <div className="item-meta">
                              <span>Ordered: {item.quantity}</span>
                              <span>
                                Fulfilled: {item.fulfilled_quantity ?? item.quantity}
                              </span>
                              <strong>£{item.total_cost}</strong>
                            </div>
                          </div>

                          <div className="availability-editor">
                            <label>
                              Fulfilled Qty
                              <input
                                type="number"
                                min="0"
                                max={item.quantity}
                                step="0.001"
                                defaultValue={item.fulfilled_quantity ?? item.quantity}
                                id={`qty-${item.id}`}
                              />
                            </label>

                            <label>
                              Availability Note
                              <input
                                type="text"
                                placeholder="e.g. Partial stock available"
                                defaultValue={item.availability_note || ""}
                                id={`note-${item.id}`}
                              />
                            </label>

                            <button
                              className="update-availability-btn"
                              onClick={() => {
                                const qty = document.getElementById(`qty-${item.id}`).value;
                                const note = document.getElementById(`note-${item.id}`).value;

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
                            <span className={`item-status ${item.status?.toLowerCase()}`}>
                              {item.status}
                            </span>

                            {item.status === "PENDING" && (
                              <>
                                <button
                                  className="confirm-item-btn"
                                  onClick={() => updateItemStatus(item.id, "CONFIRMED")}
                                >
                                  Confirm
                                </button>
                              </>
                            )}

                            {item.status === "CONFIRMED" && (
                              <>
                                <button
                                  className="ready-item-btn"
                                  onClick={() => updateItemStatus(item.id, "READY")}
                                >
                                  Mark Ready
                                </button>

                                <button
                                  className="cancel-item-btn"
                                  onClick={() => updateItemStatus(item.id, "CANCELLED")}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {item.status === "READY" && (
                              <button
                                className="delivered-item-btn"
                                onClick={() => updateItemStatus(item.id, "DELIVERED")}
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
          <div className="incoming-orders-page">
            <h1 className="incoming-orders-title">Previous Orders</h1>

            {ordersLoading && <p className="incoming-orders-message">Loading order history...</p>}
            {ordersError && <p className="incoming-orders-error">{ordersError}</p>}

            {!ordersLoading && !ordersError && completedOrders.length === 0 && (
              <p className="incoming-orders-message">No completed orders yet.</p>
            )}

            {!ordersLoading && !ordersError && completedOrders.map((order) => {
              const allCancelled = order.items?.length > 0 && order.items.every(i => i.status === "CANCELLED");
              const displayStatus = allCancelled ? "CANCELLED" : order.status;
              const isDelivered = displayStatus === "DELIVERED";
              const totalEarned = isDelivered
                ? order.items?.reduce((sum, i) => sum + parseFloat(i.total_cost || 0), 0) || 0
                : 0;

              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <h2>Order #{order.order_id}</h2>
                      <p className="order-subtitle">Customer: {order.customer_email}</p>
                      <p className="order-subtitle">
                        {new Date(order.placed_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="order-status" style={{
                      background: isDelivered ? "#dcfce7" : "#fee2e2",
                      color: isDelivered ? "#166534" : "#991b1b",
                    }}>
                      {displayStatus}
                    </span>
                  </div>

                  <div className="order-info-grid">
                    <div><span className="order-label">Postcode</span><p>{order.delivery_postcode}</p></div>
                    <div><span className="order-label">Items</span><p>{order.items?.length || 0}</p></div>
                    <div>
                      <span className="order-label">Total Earned</span>
                      <p style={{ fontWeight: 700, color: "#166534" }}>£{totalEarned.toFixed(2)}</p>
                    </div>
                  </div>

                  <h3 className="order-items-title">Items</h3>
                  <div className="order-items-list">
                    {order.items && order.items.length > 0 ? order.items.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="order-item-top">
                          <span className="product-name">{item.product_name}</span>
                          <div className="item-meta">
                            <span>Qty: {item.quantity}</span>
                            <strong>£{item.total_cost}</strong>
                          </div>
                        </div>
                        <div className="order-item-actions">
                          <span className={`item-status ${item.status?.toLowerCase()}`}>
                            {item.status}
                          </span>
                          {item.fulfilled_quantity && item.fulfilled_quantity !== item.quantity && (
                            <span style={{ fontSize: "0.78rem", color: "#92400e", marginLeft: 8 }}>
                              Fulfilled: {item.fulfilled_quantity}
                            </span>
                          )}
                          {item.availability_note && (
                            <span style={{ fontSize: "0.78rem", color: "#6b7280", marginLeft: 8 }}>
                              Note: {item.availability_note}
                            </span>
                          )}
                        </div>
                      </div>
                    )) : <p>No items.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "payout" && (
          <div className="payout-page">
            <h1 className="payout-title">Weekly Payout</h1>

            {payoutLoading && <p className="incoming-orders-message">Loading payout...</p>}

            {payoutError && <p className="incoming-orders-error">{payoutError}</p>}

            {!payoutLoading && !payoutError && payout && (
              <div className="payout-card">
                <p><strong>Week:</strong> {payout.week_start} to {payout.week_end}</p>

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
                  <p className="payout-requested" style={{ color: "#16a34a" }}>
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
                      <span>Qty: {item.quantity}</span>
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