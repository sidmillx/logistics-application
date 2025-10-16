import Card from "../components/Card";
import Table from "../components/Table";
import { useState, useEffect } from "react";
import API_BASE_URL from "../config/config";
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { Truck, Car, Activity, Fuel, Edit, Trash2 } from "lucide-react";
import styles from '../styles/buttonStyles.module.css';
import bstyles from '../styles/badgeStyles.module.css';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [entities, setEntities] = useState([]);
  const [summary, setSummary] = useState({
    totalVehicles: 0,
    available: 0,
    inUse: 0,
    fuelLoggedToday: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchData();
    fetchEntities();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/vehicles`),
        fetch(`${API_BASE_URL}/api/admin/vehicles/summary`),
      ]);
      if (!vehiclesRes.ok || !summaryRes.ok) throw new Error('Failed to fetch');

      const vehiclesData = await vehiclesRes.json();
      const summaryData = await summaryRes.json();

      setVehicles(vehiclesData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to fetch vehicle data:", err);
      toast.error("Failed to load vehicle data");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/entities`);
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      console.error("Failed to fetch entities:", err);
      toast.error("Failed to load entities");
    }
  };

  // Single delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setVehicles((prev) => prev.filter((v) => v.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id)); // Remove from selected if needed
      toast.success('Vehicle deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Error deleting vehicle');
    }
  };

  // Bulk delete selected
  const handleDeleteSelected = async (ids) => {
    const result = await Swal.fire({
      title: `Delete ${ids.length} selected vehicles?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete them!',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/vehicles/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) throw new Error("Bulk delete failed");

      setVehicles((prev) => prev.filter((v) => !ids.includes(v.id)));
      setSelectedIds([]);
      toast.success(`${ids.length} vehicles deleted`);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error("Failed to delete selected vehicles");
    }
  };

  const handleEditClick = (vehicle) => {
    setEditVehicle(vehicle);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setEditVehicle((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const method = editVehicle?.id ? 'PUT' : 'POST';
    const url = editVehicle?.id
      ? `${API_BASE_URL}/api/admin/vehicles/${editVehicle.id}`
      : `${API_BASE_URL}/api/admin/vehicles`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editVehicle),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Unknown error");

      toast.success(`Vehicle ${editVehicle?.id ? 'updated' : 'added'} successfully`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to save vehicle. Please check the form and try again.");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatStatus = (status) => {
    const statusMap = {
      'available': 'Available',
      'in-use': 'In Use',
      'maintenance': 'Maintenance'
    };

    const statusClass = {
      'available': bstyles.available,
      'in-use': bstyles.inUse,
      'maintenance': bstyles.maintenance
    };

    return (
      <span className={`${bstyles.badge} ${statusClass[status] || ''}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  const columns = [
    { key: "plateNumber", title: "Plate Number" },
    { key: "make", title: "Make" },
    { key: "model", title: "Class" },
    { key: "plantNumber", title: "Plant Number" },
    { key: "entityName", title: "Entity"},
    {
      key: "status",
      title: "Status",
      render: (cellData, row) => formatStatus(row.status)
    },
    {
      key: "createdAt",
      title: "Added On",
      render: (cellData, row) => formatDate(row.createdAt)
    },
    {
      key: "actions",
      title: "Actions",
      render: (cellData, row) => (
        <div style={{ display: "flex" }}>
          <button
            onClick={() => handleEditClick(row)}
            className={`${styles.button} ${styles.editButton}`}
          >
            <Edit className={styles.editIcon} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className={`${styles.button} ${styles.deleteButton}`}
          >
            <Trash2 className={styles.deleteIcon} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <h1 style={{ fontSize: "30px", color: "rgb(17 24 39)" }}>Vehicle Management</h1>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Vehicles" value={summary.totalVehicles} icon={<Truck style={{ color: "#16a34a" }} />} />
        <Card title="Total Available Vehicles" value={summary.available} icon={<Car style={{ color: "#2563eb" }} />} />
        <Card title="Total Vehicles in Use" value={summary.inUse} icon={<Activity style={{ color: "ea580c" }} />} />
        <Card title="Fuel Logged Today" value={summary.fuelLoggedToday} icon={<Fuel style={{ color: "#16a34a" }} />} />
      </div>

      <div style={{
        background: "#fff",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
        marginTop: "50px",
        border: "solid 1px #ccc"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3>Manage Vehicles</h3>
          <button
            onClick={() => {
              setEditVehicle({ plateNumber: "", make: "", model: "", status: "available", entityId: "" });
              setShowModal(true);
            }}
            style={{ padding: "12px 16px", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}
          >
            + Add Vehicle
          </button>
        </div>

        <Table
          columns={columns}
          data={vehicles}
          loading={loading}
          selectable={true}
          searchable={true}
          sortable={true}
          pagination={true}
          onSelectionChange={setSelectedIds}
          onDeleteSelected={handleDeleteSelected}
          rowsPerPage={10}
        />
      </div>

      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999
        }}>
          <form onSubmit={handleFormSubmit} style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 300, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginBottom: 16 }}>{editVehicle?.id ? "Edit Vehicle" : "Add New Vehicle"}</h3>
            <input type="text" name="plateNumber" placeholder="Plate Number" required value={editVehicle?.plateNumber || ""} onChange={handleChange} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
            <input type="text" name="make" placeholder="Make" required value={editVehicle?.make || ""} onChange={handleChange} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
            <input type="text" name="model" placeholder="Model" required value={editVehicle?.model || ""} onChange={handleChange} style={{ width: "100%", padding: 8, marginBottom: 12 }} />
            <input
              type="text"
              name="plantNumber"
              placeholder="Plant Number"
              value={editVehicle?.plantNumber || ""}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            />

            <select name="status" value={editVehicle?.status || "available"} onChange={handleChange} required style={{ width: "100%", padding: 8, marginBottom: 12 }}>
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select name="entityId" value={editVehicle?.entityId || ""} onChange={handleChange} required style={{ width: "100%", padding: 8, marginBottom: 12 }}>
              <option value="">-- Select Entity --</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>{entity.name}</option>
              ))}
            </select>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 12px", background: "#ccc", border: "none", borderRadius: 4, cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ padding: "8px 12px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>{editVehicle?.id ? "Update Vehicle" : "Add Vehicle"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
