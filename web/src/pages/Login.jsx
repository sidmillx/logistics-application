import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/config";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid credentials!");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h3 className="mb-3">Login</h3>
        <p style={{ marginBottom: 20 }}>Please enter your credentials.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            style={{
              ...styles.button,
              backgroundColor: loading ? "#999" : "#1e3c72",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            disabled={loading}
          >
            {loading ? (
              <div style={styles.loader}></div>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1e3c72, #2a5298)",
  },
  container: {
    background: "#fff",
    padding: 30,
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: 400,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 6,
    border: "1px solid #ccc",
    outline: "none",
    fontSize: 16,
  },
  button: {
    padding: "12px",
    width: "100%",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 16,
    height: 45,
  },
  loader: {
    width: 20,
    height: 20,
    border: "3px solid #fff",
    borderTop: "3px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

// Append global CSS for loader animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
document.head.appendChild(styleSheet);

export default Login;
