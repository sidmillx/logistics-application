import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AddDriver = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    contact: "",
    entityId: "",
  });

    // Fetch entities on component mount
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/admin/entities")
      .then((res) => res.json())
      .then((data) => setEntities(data))
      .catch((err) => console.error("Failed to fetch entities:", err))
      .finally(() => setLoading(false));
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/admin/drivers/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 400) {
        const error = await res.json();
        alert(error.error); // "Username already taken"
        return;
      }

      if(!res.ok){
        throw new Error("Failed to add driver");
      }

      const data = await res.json();
      console.log("Driver added successfully:", data);
      navigate("/driver-management");; // Redirect to drivers list or another page
    } catch (error) {
      console.error("Error adding driver:", error);
      alert("Failed to add driver. Please try again.");
    }
  }

  return (
    <div>
      <h1>Add New Driver</h1>
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
        <input type="text" name="fullName" placeholder="Full Name" required onChange={handleChange} style={{ width: "100%", padding: "8px", marginBottom: "12px" }} />
        <input type="text" name="username" placeholder="Username" required onChange={handleChange} style={{ width: "100%", padding: "8px", marginBottom: "12px" }} />
        <input type="password" name="password" placeholder="Password" required onChange={handleChange} style={{ width: "100%", padding: "8px", marginBottom: "12px" }} />
        <input type="text" name="contact" placeholder="Contact" required onChange={handleChange} style={{ width: "100%", padding: "8px", marginBottom: "12px" }} />
        {loading ? (
          <div style={{ marginBottom: "12px" }}>
            <p style={{ fontStyle: "italic", color: "#888" }}>Loading entities...</p>
          </div>
        ):(
        <select name="entityId" value={formData.entityId} onChange={handleChange} required style={inputStyle}>
          <option value="">-- Select Entity --</option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
        ))}
        </select>
        )

      }
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

const inputStyle = { width: "100%", padding: "8px", marginBottom: "12px" };

export default AddDriver;
