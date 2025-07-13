import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/config";


const EditEntity = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 useEffect(() => {
   const fetchEntity = async () => {
     try {
       const res = await fetch(`${API_BASE_URL}/api/admin/entities/${id}`);
       if (!res.ok) throw new Error("Failed to fetch entity");
       const data = await res.json();
       setFormData({
         name: data.name || "",
         description: data.description || "",
       });
     } catch (err) {
       console.error("Error loading entity:", err);
     }
   };
   fetchEntity();
 }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Here you could send to your backend API
    console.log("New Entity:", formData);
    try {
     const res = await fetch(`${API_BASE_URL}/api/admin/entities/${id}`, {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(formData),
     });
     if (!res.ok) throw new Error("Failed to update entity");
     toast.success("Entity updated successfully!");
     navigate("/entities");
   } catch (err) {
     console.error("Update failed:", err);
     toast.error("Failed to update entity. Please try again.");
   }
  };

  return (
    <div>
      <h1>Edit Entity</h1>
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
          <label>Entity Name:</label><br />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
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
          Save Entity
        </button>
      </form>
    </div>
  );
};

export default EditEntity;
