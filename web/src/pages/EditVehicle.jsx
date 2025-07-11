import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    plateNumber: "",
    make: "",
    model: "",
    status: "available",
  });

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/admin/vehicles/${id}`);
        if (!res.ok) throw new Error("Failed to fetch vehicle");
        const data = await res.json();
        setFormData({
          plateNumber: data.plateNumber || "",
          make: data.make || "",
          model: data.model || "",
          status: data.status || "available",
        });
      } catch (err) {
        console.error("Error loading vehicle:", err);
      }
    };

    fetchVehicle();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update vehicle");
      alert("Vehicle updated successfully!");
      navigate("/vehicles");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error updating vehicle");
    }
  };

  return (
    <div>
      <h1>Edit Vehicle</h1>
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
          <label>Plate Number:</label><br />
          <input
            type="text"
            name="plateNumber"
            value={formData.plateNumber}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Make:</label><br />
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Model:</label><br />
          <input
            type="text"
            name="model"
            value={formData.model}
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
            <option value="available">Available</option>
            <option value="in-use">In Use</option>
            <option value="maintenance">Maintenance</option>
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
          Save Vehicle
        </button>
      </form>
    </div>
  );
};

export default EditVehicle;
