import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const EditDriver = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    entity: "",
    contact: "",
    status: "Available",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you could send to your backend API
    console.log("New Driver:", formData);
    // Redirect back to Driver Management
    navigate("/driver-management");
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
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <label>Driver Name:</label><br />
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
          <label>Entity:</label><br />
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
          <label>Contact:</label><br />
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
          <label>Status:</label><br />
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
            cursor: "pointer"
          }}
        >
          Save Driver
        </button>
      </form>
    </div>
  );
};

export default EditDriver;
