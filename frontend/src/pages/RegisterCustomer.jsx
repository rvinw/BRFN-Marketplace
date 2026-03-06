import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../services/api";

function RegisterCustomer() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: "",
    customer_type: "INDIVIDUAL",
    org_name: "",
    line_1: "",
    line_2: "",
    city: "",
    postcode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/customer/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Customer registration failed:", data);
        alert("Customer registration failed");
        return;
      }

      alert("Customer registered successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Error:", error);
      alert("Server error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Customer Registration</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label>Username</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} style={styles.input} required />

          <label>Full Name</label>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} style={styles.input} required />

          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} required />

          <label>Phone</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} />

          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} style={styles.input} required />

          <label>Customer Type</label>
          <select name="customer_type" value={formData.customer_type} onChange={handleChange} style={styles.input}>
            <option value="INDIVIDUAL">Individual</option>
            <option value="COMMUNITY_GROUP">Community Group</option>
            <option value="RESTAURANT">Restaurant</option>
          </select>

          <label>Organisation Name</label>
          <input type="text" name="org_name" value={formData.org_name} onChange={handleChange} style={styles.input} />

          <label>Address Line 1</label>
          <input type="text" name="line_1" value={formData.line_1} onChange={handleChange} style={styles.input} required />

          <label>Address Line 2</label>
          <input type="text" name="line_2" value={formData.line_2} onChange={handleChange} style={styles.input} />

          <label>City</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange} style={styles.input} required />

          <label>Postcode</label>
          <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} style={styles.input} required />

          <button type="submit" style={styles.button}>
            Register as Customer
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    marginTop: "50px",
    marginBottom: "50px",
  },
  card: {
    width: "500px",
    padding: "30px",
    borderRadius: "12px",
    background: "#ffffff",
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "6px",
    border: "none",
    background: "#2c7be5",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default RegisterCustomer;