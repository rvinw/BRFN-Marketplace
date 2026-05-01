import { useEffect, useState } from "react";
import AddProductForm from "../sections/AddProductForm";
import CommunityEngagement from "../sections/CommunityEngagement";
import "./ProducerDashboardPage.css";

export default function ProducerDashboardPage() {
  const [view, setView] = useState("home");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const menuItems = [
    { id: "home", label: "My Products" },
    { id: "add", label: "Add Product" },
    { id: "orders", label: "Incoming Orders" },
    { id: "history", label: "Previous Orders" },
    { id: "payout", label: "Weekly Payout" },
    { id: "community", label: "Community Engagement" },
  ];

  const getToken = () =>
    localStorage.getItem("brfn_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token");

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

  useEffect(() => {
    if (view === "orders") {
      fetchIncomingOrders();
    }
  }, [view]);

  return (
    <div className="main-container">
      <nav className="dashboard-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={view === item.id ? "dashboard-tab active" : "dashboard-tab"}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="producer-content-area">
        {view === "home" && (
          <div className="producer-card">
            <h1 className="page-title">My Product Inventory</h1>
            <p className="read-the-docs">
              Current listings will appear here shortly.
            </p>
          </div>
        )}

        {view === "add" && (
          <div className="form-container">
            <h1 style={{ color: "#a3e635" }}>Add New Product</h1>
            <div style={{ color: "#333" }}>
              <AddProductForm onNavigate={setView} />
            </div>
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
                            <span className="product-name">
                              {item.product_name}
                            </span>

                            <div className="item-meta">
                              <span>Qty: {item.quantity}</span>
                              <strong>£{item.total_cost}</strong>
                            </div>
                          </div>

                          <div className="order-item-actions">
                            <span
                              className={`item-status ${item.status?.toLowerCase()}`}
                            >
                              {item.status}
                            </span>

                            {item.status === "PENDING" && (
                              <>
                                <button
                                  className="confirm-item-btn"
                                  onClick={() =>
                                    updateItemStatus(item.id, "CONFIRMED")
                                  }
                                >
                                  Confirm
                                </button>

                                <button
                                  className="cancel-item-btn"
                                  onClick={() =>
                                    updateItemStatus(item.id, "CANCELLED")
                                  }
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {item.status === "CONFIRMED" && (
                              <>
                                <button
                                  className="ready-item-btn"
                                  onClick={() =>
                                    updateItemStatus(item.id, "READY")
                                  }
                                >
                                  Mark Ready
                                </button>

                                <button
                                  className="cancel-item-btn"
                                  onClick={() =>
                                    updateItemStatus(item.id, "CANCELLED")
                                  }
                                >
                                  Cancel
                                </button>
                              </>
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
          <div className="producer-card">
            <h1 className="page-title">Weekly Payout</h1>
            <p>Track your earnings and upcoming transfers.</p>
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