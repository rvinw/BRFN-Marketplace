import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loginData = {
      username,
      password,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Login failed:", data);
        alert("Invalid username or password");
        return;
      }

      // Save JWT tokens
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      // Fetch current user info
      const meResponse = await fetch(`${API_BASE_URL}/auth/me/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.access}`,
        },
      });

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        console.error("Failed to fetch user profile:", meData);
        alert("Login succeeded, but failed to load profile");
        return;
      }

      localStorage.setItem("user", JSON.stringify(meData));

      // Redirect by role
      if (meData.role_name === "PRODUCER") {
        navigate("/producer");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Server error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        <p style={styles.text}>Don't have an account?</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: "80px",
  },
  card: {
    width: "400px",
    padding: "30px",
    borderRadius: "12px",
    background: "#fff",
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
  text: {
    textAlign: "center",
    marginTop: "15px",
    fontSize: "14px",
  },
};

export default Login;