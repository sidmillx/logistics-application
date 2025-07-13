import React, { useEffect, useState } from "react";
import API_BASE_URL from "../config/config";
import { toast } from "react-toastify";

const AdminSettings = () => {
  const [user, setUser] = useState({
    fullname: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch current logged-in user info
  useEffect(() => {
    const fetchProfile = async () => {
      try {
       const token = localStorage.getItem("token"); // or sessionStorage, wherever you store it

        const res = await fetch(`${API_BASE_URL}/api/admin/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

        setUser({ fullname: data.fullname, username: data.username, password: "" });
      } catch (err) {
        toast.error("Failed to load profile");
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token"); // or wherever you store your JWT

    const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,  // <-- send token here
    },
    body: JSON.stringify(user),
    });


      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error("Failed to update settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1>Admin Settings</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <label>Full Name</label>
        <input
          type="text"
          name="fullname"
          value={user.fullname}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: 8, marginBottom: 16 }}
        />

        <label>Username</label>
        <input
          type="text"
          name="username"
          value={user.username}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: 8, marginBottom: 16 }}
        />

        <label>New Password (leave blank to keep existing)</label>
        <input
          type="password"
          name="password"
          value={user.password}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 24 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 24px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
