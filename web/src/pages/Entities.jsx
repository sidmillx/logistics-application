import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import API_BASE_URL from "../config/config";
import { toast } from "react-toastify";
import { Edit, Trash2 } from "lucide-react";
import styles from '../styles/buttonStyles.module.css';
import { Building2, Truck, CheckCircle } from "lucide-react";
import { FadeLoader } from "react-spinners";


const Entities = () => {
  const [summary, setSummary] = useState({ totalEntities: 0, totalVehicles: 0, availableVehicles: 0 });
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null); // null = adding new

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch summary and entity data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, entityStatsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/summary`),
        fetch(`${API_BASE_URL}/api/admin/entities/overview`)
      ]);

      if (!summaryRes.ok || !entityStatsRes.ok) throw new Error('Failed to fetch');

      const summaryData = await summaryRes.json();
      const entityStats = await entityStatsRes.json();

      setSummary(summaryData);
      setTableData(entityStats.entitySummaries);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load entities data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entity?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/entities/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Entity deleted successfully");
      setTableData(prev => prev.filter(e => e.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));

      // Refresh summary
      const summaryRes = await fetch(`${API_BASE_URL}/api/admin/summary`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData);
    } catch (err) {
      console.error("Error deleting entity:", err);
      toast.error("Failed to delete entity");
    }
  };

  const handleDeleteSelected = async (ids) => {
    if (ids.length === 0) return;

    if (!window.confirm(`Delete ${ids.length} selected entities? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/entities/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) throw new Error("Bulk delete failed");

      toast.success(`${ids.length} entities deleted`);
      setTableData(prev => prev.filter(e => !ids.includes(e.id)));
      setSelectedIds([]);

      // Refresh summary
      const summaryRes = await fetch(`${API_BASE_URL}/api/admin/summary`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData);
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete selected entities");
    }
  };

  // Open modal for add or edit
  const openAddModal = () => {
    setEditingEntity(null);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const openEditModal = async (entity) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/entities/${entity.id}`);
      if (!res.ok) throw new Error("Failed to fetch entity details");
      const data = await res.json();
      setFormData({
        name: data.name || "",
        description: data.description || "",
      });
      setEditingEntity(entity);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to load entity for editing:", err);
      toast.error("Failed to load entity details");
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingEntity
      ? `${API_BASE_URL}/api/admin/entities/${editingEntity.id}`
      : `${API_BASE_URL}/api/admin/entities`;

    const method = editingEntity ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save entity");

      toast.success(editingEntity ? "Entity updated successfully!" : "Entity added successfully!");
      setShowModal(false);
      setEditingEntity(null);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error saving entity:", err);
      toast.error("Failed to save entity. Please try again.");
    }
  };

  const columns = [
    { key: "name", title: "Entity Name" },
    { key: "totalVehicles", title: "Total Vehicles" },
    { key: "vehiclesInUse", title: "Vehicles in Use" },
    { key: "vehiclesAvailable", title: "Vehicles Available" },
    { key: "underMaintenance", title: "Vehicles Under Maintenance" },
    {
      key: "actions",
      title: "Actions",
      render: (cellData, row) => (
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => openEditModal(row)}
            className={`${styles.button} ${styles.editButton}`}
          >
            <Edit className={styles.editIcon}/>
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className={`${styles.button} ${styles.deleteButton}`}
          >
            <Trash2 className={styles.deleteIcon}/>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Entity Management</h1>

      {loading ? (
        // <p style={{ fontStyle: "italic", color: "#888" }}>Loading data...</p>
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%"}}>

          <FadeLoader />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <Card title="Total Entities" value={summary.totalEntities} icon={<Building2 style={{ color: '#2563eb' }} />}/>
            <Card title="Total Vehicles Across Entities" value={summary.totalVehicles} icon={<Truck style={{ color: "#16a34a" }} />}/>
            <Card title="Vehicles Available" value={summary.availableVehicles} icon={<CheckCircle style={{ color: "#ea580c" }} />}/>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
              border: "solid 1px #ccc",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3>Manage Entities</h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => handleDeleteSelected(selectedIds)}
                    className={`${styles.button} ${styles.deleteButton}`}
                    style={{ padding: "8px 16px" }}
                  >
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={openAddModal}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  + Add Entity
                </button>
              </div>
            </div>

            {tableData.length > 0 ? (
              <Table
                columns={columns}
                data={tableData}
                loading={loading}
                selectable={true}
                searchable={true}
                sortable={true}
                pagination={true}
                onSelectionChange={setSelectedIds}
                rowsPerPage={10}
                selectedRows={selectedIds}
              />
            ) : (
              <p style={{ fontStyle: "italic", color: "#888" }}>No entities to display.</p>
            )}
          </div>
        </>
      )}

      {/* Modal for Add/Edit Entity */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: 16 }}>
              {editingEntity ? "Edit Entity" : "Add New Entity"}
            </h3>

            <div style={{ marginBottom: "16px" }}>
              <label>Entity Name:</label>
              <br />
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
              <label>Description (optional):</label>
              <br />
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingEntity(null);
                }}
                style={{
                  padding: "8px 12px",
                  background: "#ccc",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {editingEntity ? "Update Entity" : "Add Entity"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Entities;
