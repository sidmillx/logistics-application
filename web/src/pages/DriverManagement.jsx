import Card from "../components/Card";
import Table from "../components/Table";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/config";
import { Users, UserRoundCheck, BarChart3, Edit, Trash2 } from "lucide-react";
import styles from '../styles/buttonStyles.module.css';
import bstyles from '../styles/badgeStyles.module.css';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [entities, setEntities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [summary, setSummary] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    avgTripsPerDriver: 0,
  });

  useEffect(() => {
    fetchData();
    fetchEntities();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driversRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/drivers`),
        fetch(`${API_BASE_URL}/api/admin/drivers/summary`),
      ]);

      if (!driversRes.ok || !summaryRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const driversData = await driversRes.json();
      const summaryData = await summaryRes.json();

      setDrivers(driversData);
      setSummary({
        totalDrivers: summaryData.totalDrivers,
        activeDrivers: summaryData.activeDrivers,
        avgTripsPerDriver: summaryData.avgTripsPerDriver,
      });
    } catch (err) {
      console.error("Error loading drivers data:", err);
      toast.error("Failed to load drivers data");
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

  // Single delete (action buttons)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/drivers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Driver deleted");
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      // Also remove from selection if selected
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    } catch (err) {
      console.error("Failed to delete driver:", err);
      toast.error("Failed to delete driver");
    }
  };

  // Bulk delete from Table's bulk actions dropdown
  const handleDeleteSelected = async (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} selected drivers?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/drivers/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) throw new Error("Bulk delete failed");

      toast.success(`${ids.length} drivers deleted`);
      setDrivers((prev) => prev.filter((d) => !ids.includes(d.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error("Failed to delete selected drivers");
    }
  };

  const handleEditClick = (driver) => {
    setEditDriver({
      id: driver.id,
      name: driver.name || driver.fullname || "", // Support both
      username: driver.username,
      contact: driver.contact,
      entityId: driver.entityId || "",
      status: driver.status || "Available",
    });
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    setEditDriver({ ...editDriver, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const url = editDriver?.id
      ? `${API_BASE_URL}/api/admin/drivers/${editDriver.id}`
      : `${API_BASE_URL}/api/admin/drivers/add`;
    const method = editDriver?.id ? "PUT" : "POST";

    if (!editDriver.name?.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!editDriver.username?.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!editDriver.contact?.trim()) {
      toast.error("Contact is required");
      return;
    }
    if (!editDriver.entityId) {
      toast.error("Entity is required");
      return;
    }
    if (!editDriver?.id && !editDriver.password?.trim()) {
      toast.error("Password is required for new drivers");
      return;
    }

    const payload = {
      fullname: editDriver.name.trim(),
      username: editDriver.username.trim(),
      password: editDriver.password || undefined,
      contact: editDriver.contact.trim(),
      entityId: editDriver.entityId,
      status: editDriver.status,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save driver");

      toast.success(`Driver ${editDriver?.id ? "updated" : "added"} successfully`);
      setShowAddModal(false);
      setEditDriver(null);
      fetchData();
    } catch (err) {
      console.error("Error saving driver:", err);
      toast.error("Failed to save driver");
    }
  };

  const columns = [
    {
      key: "name",
      title: "Driver Name",
      render: (value, row) => value || row.fullname || "N/A",
    },
    { key: "entityName", title: "Entity" },
    { key: "contact", title: "Contact" },
    {
      key: "status",
      title: "Status",
      render: (cellData, row) => (
        <span
          className={row.isActive ? `${bstyles.badge} ${bstyles.available}` : `${bstyles.badge} ${bstyles.maintenance}`}
        >
          {row.isActive ? "Active" : "Not Active"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (cellData, row) => (
        <div style={{ display: "flex", gap: "12px" }}>
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
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "30px", color: "rgb(17 24 39)" }}>Driver Management</h1>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Drivers" value={summary.totalDrivers} icon={<Users style={{ color: "#2563eb" }} />} />
        <Card title="Active Drivers" value={summary.activeDrivers} icon={<UserRoundCheck style={{ color: "#16a34a" }} />} />
        <Card title="Avg Trip per Driver" value={summary.avgTripsPerDriver} icon={<BarChart3 style={{ color: "ea580c" }} />} />
      </div>

      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "8px",
          border: "solid 1px #ccc",
          boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
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
          <h3>Manage Drivers</h3>
          <button
            onClick={() => {
              setEditDriver({ name: "", username: "", password: "", contact: "", entityId: "" });
              setShowAddModal(true);
            }}
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
            + Add Driver
          </button>
        </div>

        {/* Pass all new props for selection, bulk delete, loading */}
        <Table
          columns={columns}
          data={drivers}
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

      {showAddModal && (
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
            onSubmit={handleFormSubmit}
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              width: "550px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: 16 }}>{editDriver?.id ? "Edit Driver" : "Add New Driver"}</h3>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              value={editDriver?.name || ""}
              onChange={handleFormChange}
              style={{ width: "500px", padding: 8, marginBottom: 12 }}
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              value={editDriver?.username || ""}
              onChange={handleFormChange}
              style={{ width: "500px", padding: 8, marginBottom: 12 }}
            />
            {!editDriver?.id && (
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                value={editDriver?.password || ""}
                onChange={handleFormChange}
                style={{ width: "500px", padding: 8, marginBottom: 12 }}
              />
            )}
            <input
              type="text"
              name="contact"
              placeholder="Contact"
              required
              value={editDriver?.contact || ""}
              onChange={handleFormChange}
              style={{ width: "500px", padding: 8, marginBottom: 12 }}
            />
            <select
              name="entityId"
              value={editDriver?.entityId || ""}
              onChange={handleFormChange}
              style={{ width: "500px", padding: 8, marginBottom: 12 }}
              required
            >
              <option value="">-- Select Entity --</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {editDriver?.id ? "Update Driver" : "Add Driver"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
