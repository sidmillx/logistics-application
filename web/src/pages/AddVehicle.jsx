import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddVehicle = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([]);
  const [formData, setFormData] = useState({
    plateNumber: "",
    make: "",
    model: "",
    status: "available",
    entityId: "",
  });

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/entities");
        const data = await res.json();
        setEntities(data);
      } catch (err) {
        console.error("Failed to fetch entities:", err);
      }
    };

    fetchEntities();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to add vehicle");

      // alert("Vehicle created successfully!");
      toast.success("Vehicle created successfully!");
      navigate("/vehicle-management");
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to add vehicle. Please try again.");
    }
  };

  return (
    <div>
      <h1>Add New Vehicle</h1>
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
            required
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="available">Available</option>
            <option value="in-use">In Use</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Entity:</label><br />
          <select
            name="entityId"
            value={formData.entityId}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="">-- Select Entity --</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
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

export default AddVehicle;
