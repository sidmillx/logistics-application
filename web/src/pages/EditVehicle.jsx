import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/config";


const EditVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    plateNumber: "",
    make: "",
    model: "",
    status: "available",
    entityId: "",
  });

  const [entities, setEntities] = useState([]);

  // Fetch entities and vehicle on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entityRes, vehicleRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/entities`),
          fetch(`${API_BASE_URL}/api/admin/vehicles/${id}`),
        ]);

        if (!entityRes.ok || !vehicleRes.ok) throw new Error("Fetch error");

        const entityData = await entityRes.json();
        const vehicleData = await vehicleRes.json();

        setEntities(entityData);
        setFormData({
          plateNumber: vehicleData.plateNumber || "",
          make: vehicleData.make || "",
          model: vehicleData.model || "",
          status: vehicleData.status || "available",
          entityId: vehicleData.entityId || "",
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Failed to load vehicle or entities");
      }
    };

    fetchData();
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
      const res = await fetch(`${API_BASE_URL}/api/admin/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update vehicle");

      toast.success("Vehicle updated successfully!");
      navigate("/vehicles");
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update vehicle. Please try again.");}
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
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditVehicle;
