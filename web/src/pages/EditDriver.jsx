import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/config";

const EditDriver = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get driver ID from URL

  const [formData, setFormData] = useState({
    name: "",
    entity: "",
    contact: "",
    status: "Available",
  });

  // Fetch driver data on load
  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/drivers/${id}`);
        const data = await res.json();
        setFormData({
          name: data.name || "",
          entity: data.company || "",
          contact: data.phone || "",
          status: data.status || "Available",
        });

        console.log("Driver data loaded:", data);
      } catch (err) {
        toast.error("Failed to load driver details");
        console.error(err);
      }
    };

    if (id) fetchDriver();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/drivers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Driver updated successfully");
        navigate("/driver-management");
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to update driver");
      }
    } catch (err) {
      toast.error("Update failed");
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Edit Driver</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <label>Driver Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Entity:</label>
          <input
            type="text"
            name="entity"
            value={formData.entity}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Contact:</label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save Driver
        </button>
      </form>
    </div>
  );
};

export default EditDriver;
