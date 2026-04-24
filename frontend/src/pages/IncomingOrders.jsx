import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000/api";

export default function IncomingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const access = localStorage.getItem("access");

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders/incoming/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data);
      } else {
        console.error(data);
        alert("Failed to load incoming orders");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while loading orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, ready_for_delivery = false) => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/status/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ status, ready_for_delivery }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchOrders();
      } else {
        console.error(data);
        alert("Failed to update order");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while updating order");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return <p style={{ padding: "30px" }}>Loading orders...</p>;
  }

  const getStatusStyle = (status) => {
  switch (status) {
    case "PENDING":
      return { color: "#b26a00", background: "#fff3cd" };
    case "COMPLETED":
      return { color: "#0f5132", background: "#d1e7dd" };
    case "READY_FOR_DELIVERY":
      return { color: "#084298", background: "#cfe2ff" };
    default:
      return { color: "#333", background: "#eee" };
  }
};

  return (
    <div style={{ padding: "30px" }}>
   
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
        Incoming Orders
      </h2>

      {orders.length === 0 ? (
        <p>No incoming orders yet.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            style={{
                border: "1px solid #e5e5e5",
                borderRadius: "14px",
                padding: "24px",
                marginBottom: "20px",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3>Order #{order.id}</h3>
            <p><strong>Customer:</strong> {order.customer_username}</p>
            <p>
                <strong>Status:</strong>{" "}
                <span
                    style={{
                    ...getStatusStyle(order.status),
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontWeight: "600",
                    fontSize: "14px",
                    display: "inline-block",
                    }}
                >
                    {order.status.replaceAll("_", " ")}
                </span>
            </p>
            <p><strong>Total:</strong> £{order.total_price}</p>
            <p>
              <strong>Ready for delivery:</strong>{" "}
              {order.ready_for_delivery ? "Yes" : "No"}
            </p>

            <div>
              <strong>Items:</strong>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product_name} — Qty: {item.quantity} — £{item.unit_price}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                    onClick={() => updateOrderStatus(order.id, "COMPLETED", false)}
                    disabled={order.status !== "PENDING"}
                    style={{
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: order.status !== "PENDING" ? "not-allowed" : "pointer",
                    background: order.status !== "PENDING" ? "#ddd" : "#198754",
                    color: "white",
                    fontWeight: "600",
                    }}
                >
                    Complete Order
                </button>

                <button
                    onClick={() =>
                    updateOrderStatus(order.id, "READY_FOR_DELIVERY", true)
                    }
                    disabled={order.status === "READY_FOR_DELIVERY"}
                    style={{
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: order.status === "READY_FOR_DELIVERY" ? "not-allowed" : "pointer",
                    background: order.status === "READY_FOR_DELIVERY" ? "#ddd" : "#0d6efd",
                    color: "white",
                    fontWeight: "600",
                    }}
                >
                    Ready for Delivery
                </button>
            </div>

          </div>
        ))
      )}
    </div>
  );
}