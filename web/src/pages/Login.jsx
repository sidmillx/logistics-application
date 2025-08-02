import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/config";
import { Eye, EyeOff, Lock, User, Shield } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        position: "relative",
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Login Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          position: "relative",
          zIndex: 10,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderRadius: "0.5rem",
          border: "none",
          backgroundColor: "white",
        }}
      >
        {/* Card Header */}
        <div
          style={{
            padding: "1.5rem",
            paddingBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "10rem", height: "10rem", position: "relative" }}>
              <img
                src="/icons/Inyatsi Logo.png"
                alt="Inyatsi Group Holdings"
                style={{
                  objectFit: "contain",
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          </div>

          {/* Header */}
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <Shield style={{ width: "1.25rem", height: "1.25rem", color: "#1e3c72" }} />
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 0,
                }}
              >
                Admin Portal
              </h2>
            </div>
            <p style={{ color: "#6b7280", margin: 0 }}>
              Secure access to Inyatsi Group Holdings administration
            </p>
          </div>
        </div>

        {/* Card Content */}
        <div style={{ padding: "1rem" }}>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Username Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="username"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Username
              </label>
              <div style={{ position: "relative" }}>
                <User
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "1rem",
                    height: "1rem",
                    color: "#9ca3af",
                  }}
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  style={{
                    paddingLeft: "2.5rem",
                    height: "3rem",
                    width: "90%",
                    borderRadius: "0.375rem",
                    borderWidth: "1px",
                    borderColor: "#e5e7eb",
                    outline: "none",
                    fontSize: "0.875rem",
                    color: "#111827",
                    backgroundColor: "white",
                  }}
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "1rem",
                    height: "1rem",
                    color: "#9ca3af",
                  }}
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    paddingLeft: "2.5rem",
                    paddingRight: "2.5rem",
                    height: "3rem",
                    width: "80%",
                    borderRadius: "0.375rem",
                    borderWidth: "1px",
                    borderColor: "#e5e7eb",
                    outline: "none",
                    fontSize: "0.875rem",
                    color: "#111827",
                    backgroundColor: "white",
                  }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: "1rem", height: "1rem" }} />
                  ) : (
                    <Eye style={{ width: "1rem", height: "1rem" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              style={{
                width: "100%",
                height: "3rem",
                color: "white",
                fontWeight: 500,
                transition: "all 0.2s",
                opacity: loading || !formData.username || !formData.password ? 0.5 : 1,
                backgroundColor: "#1e3c72",
                borderRadius: "0.375rem",
                border: "none",
                cursor:
                  loading || !formData.username || !formData.password
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "1rem",
                      height: "1rem",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Signing In...
                </>
              ) : (
                "Sign In to Admin Portal"
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              Protected by enterprise-grade security
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Branding */}
      <div
        style={{
          position: "absolute",
          bottom: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.875rem" }}>
          © {new Date().getFullYear()} Inyatsi Group Holdings. All rights reserved.
        </p>
      </div>

      {/* Global styles for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Login;