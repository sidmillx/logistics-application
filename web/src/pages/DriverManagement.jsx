import Card from "../components/Card";
import Table from "../components/Table";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/config";

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [entities, setEntities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);

  const [summary, setSummary] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    avgTripsPerDriver: 0,
  });

  const [newDriver, setNewDriver] = useState({
    fullName: "",
    username: "",
    password: "",
    contact: "",
    entityId: "",
  });

  useEffect(() => {
    fetchData();
    fetchEntities();
  }, []);

  const fetchData = async () => {
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
    }
  };

  const fetchEntities = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/entities`);
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      console.error("Failed to fetch entities:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/drivers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Driver deleted");
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete driver:", err);
      toast.error("Failed to delete driver");
    }
  };

  const handleEditClick = (driver) => {
    setEditDriver({
      id: driver.id,
      name: driver.name || driver.fullname || "", // Handle both name and fullname
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

    // Validate required fields
    if (!editDriver.name || !editDriver.name.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!editDriver.username || !editDriver.username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!editDriver.contact || !editDriver.contact.trim()) {
      toast.error("Contact is required");
      return;
    }
    if (!editDriver.entityId) {
      toast.error("Entity is required");
      return;
    }
    if (!editDriver?.id && (!editDriver.password || !editDriver.password.trim())) {
      toast.error("Password is required for new drivers");
      return;
    }

    // Create payload with correct field names for backend
    const payload = {
      fullname: editDriver.name.trim(), // Ensure no empty or whitespace-only values
      username: editDriver.username.trim(),
      password: editDriver.password || undefined, // Only send password for new drivers
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
      render: (value, row) => value || row.fullname || "N/A", // Handle both name and fullname
    },
    { key: "entityName", title: "Entity" },
    { key: "contact", title: "Contact" },
    {
      key: "status",
      title: "Status",
      render: (cellData, row) => (
        <span
          style={{
            color: row.isActive ? "#4CAF50" : "#F44336",
            fontWeight: 500,
          }}
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
            style={{ border: "none", background: "transparent", cursor: "pointer" }}
          >
            <img src="/icons/edit.svg" alt="edit icon" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            style={{ border: "none", background: "transparent", cursor: "pointer" }}
          >
            <img src="/icons/delete.svg" alt="delete icon" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Driver Management</h1>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Drivers" value={summary.totalDrivers} icon={<img src="/icons/groups.svg" />} />
        <Card title="Active Drivers" value={summary.activeDrivers} icon={<img src="/icons/person_pin_circle.svg" />} />
        <Card title="Avg Trip per Driver" value={summary.avgTripsPerDriver} icon={<img src="/icons/barchart.svg" />} />
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
        <Table columns={columns} data={drivers} />
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
              minWidth: 300,
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
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              value={editDriver?.username || ""}
              onChange={handleFormChange}
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            />
            {!editDriver?.id && (
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                value={editDriver?.password || ""}
                onChange={handleFormChange}
                style={{ width: "100%", padding: 8, marginBottom: 12 }}
              />
            )}
            <input
              type="text"
              name="contact"
              placeholder="Contact"
              required
              value={editDriver?.contact || ""}
              onChange={handleFormChange}
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            />
            <select
              name="entityId"
              value={editDriver?.entityId || ""}
              onChange={handleFormChange}
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
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