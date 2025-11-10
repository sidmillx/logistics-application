// src/pages/UserManagement.jsx
import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/config";



const UserManagement = () => {
  const [supervisionLogs, setSupervisionLogs] = useState([]);

const fetchSupervisionLogs = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/admin/supervision-logs`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      }});
    if (!res.ok) throw new Error("Failed to fetch supervision logs");
    const data = await res.json();
    setSupervisionLogs(data);
  } catch (err) {
    console.error("Error fetching supervision logs:", err);
  }
};

// call in useEffect
useEffect(() => {
  fetchSupervisionLogs();
}, []);



  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingRoles, setEditingRoles] = useState({});
  const [editingPasswords, setEditingPasswords] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);

  // New supervisor-specific fields
  const [entities, setEntities] = useState([]);
  const [newUser, setNewUser] = useState({
    fullname: "",
    username: "",
    password: "",
    role: "admin", // default
    phoneNumber: "", // supervisor-only
    entityId: "", // supervisor-only
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [supervisorAssignments, setSupervisorAssignments] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSupervisorAssignments();
    fetchEntities();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  // Fetch users (existing endpoint)
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`,{
        headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, 
      }},
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load users");
      console.error(err);
    }
  };

  // Fetch entities for supervisor entity selection
  const fetchEntities = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/supervisors/entities`,{
        headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, 
      }},);
      if (!res.ok) throw new Error("Failed to fetch entities");
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      toast.error("Failed to load entities");
      console.error(err);
    }
  };

  const fetchSupervisorAssignments = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/supervisor-assignments`,{
        headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, 
      }},
      );
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data = await res.json();
      setSupervisorAssignments(data);
    } catch (err) {
      toast.error("Failed to load supervisor assignments");
      console.error(err);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.fullname && user.fullname.toLowerCase().includes(lower)) ||
          (user.username && user.username.toLowerCase().includes(lower))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = (id, newRole) => {
    setEditingRoles((prev) => ({ ...prev, [id]: newRole }));
  };

  const handlePasswordChange = (id, newPassword) => {
    setEditingPasswords((prev) => ({ ...prev, [id]: newPassword }));
  };

  const handleSaveRoleAndPassword = async (id) => {
    const newRole = editingRoles[id];
    const newPassword = editingPasswords[id];

    if (!newRole && (!newPassword || newPassword.trim() === "")) return;

    try {
      const bodyData = {};
      if (newRole) bodyData.role = newRole;
      if (newPassword) bodyData.password = newPassword;

      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to update user");
      }

      toast.success("User updated");
      setEditingRoles((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setEditingPasswords((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      fetchUsers();
    } catch (err) {
      toast.error("Error updating user");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Delete failed");
      }

      toast.success("User removed");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      // Also refresh assignments (in case deleted user was supervisor/driver)
      fetchSupervisorAssignments();
    } catch (err) {
      toast.error("Error deleting user");
      console.error(err);
    }
  };

  // Add user (handles supervisors specially)
  const handleAddUser = async (e) => {
    e.preventDefault();

    // basic validation
    if (!newUser.fullname || !newUser.username || !newUser.password) {
      toast.error("Fullname, username and password are required");
      return;
    }

    try {
      if (newUser.role === "supervisor") {
        // require phone and entity for supervisors
        if (!newUser.phoneNumber || !newUser.entityId) {
          toast.error("Supervisor requires phone number and assigned entity");
          return;
        }

        // call supervisor creation endpoint (creates both user + supervisor rows)
        const res = await fetch(`${API_BASE_URL}/api/admin/supervisors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullname: newUser.fullname,
            username: newUser.username,
            password: newUser.password,
            phoneNumber: newUser.phoneNumber,
            entityId: newUser.entityId,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const errText = errJson?.message || (await res.text());
          throw new Error(errText || "Failed to add supervisor");
        }
      } else {
        // create normal user (admin or driver)
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullname: newUser.fullname,
            username: newUser.username,
            password: newUser.password,
            role: newUser.role,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const errText = errJson?.message || (await res.text());
          throw new Error(errText || "Failed to add user");
        }
      }

      toast.success("User added successfully");
      setShowAddModal(false);
      setNewUser({
        fullname: "",
        username: "",
        password: "",
        role: "admin",
        phoneNumber: "",
        entityId: "",
      });

      // refresh lists
      fetchUsers();
      fetchSupervisorAssignments();
    } catch (err) {
      toast.error(err.message || "Failed to add user");
      console.error(err);
    }
  };

  const handleAssignSupervisor = async (e) => {
    e.preventDefault();
    if (!selectedSupervisor || !selectedDriver) {
      toast.error("Please select both a supervisor and a driver");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/supervisor-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorId: selectedSupervisor,
          driverId: selectedDriver,
        }),
      });

      if (!res.ok) throw new Error("Failed to assign supervisor");

      toast.success("Supervisor assigned to driver successfully");
      setShowAssignmentModal(false);
      setSelectedSupervisor("");
      setSelectedDriver("");
      fetchSupervisorAssignments();
    } catch (err) {
      toast.error("Failed to assign supervisor");
      console.error(err);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to remove this assignment?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/supervisor-assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove assignment");

      toast.success("Assignment removed");
      setSupervisorAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      toast.error("Error removing assignment");
      console.error(err);
    }
  };

  // Table column definitions (keeps the original render style)
  const columns = [
    { key: "fullname", title: "Name" },
    { key: "username", title: "Username" },
    {
      key: "role_password",
      title: "Role & Password",
      render: (cellValue, row) => {
        if (!row || !row.id) return null;

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <select
              value={editingRoles[row.id] ?? row.role}
              onChange={(e) => handleRoleChange(row.id, e.target.value)}
              style={{ padding: "4px" }}
            >
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="driver">Driver</option>
            </select>

            <input
              type="password"
              placeholder="New password"
              value={editingPasswords[row.id] ?? ""}
              onChange={(e) => handlePasswordChange(row.id, e.target.value)}
              style={{ padding: "4px", width: 150 }}
            />

            {(editingRoles[row.id] || (editingPasswords[row.id] && editingPasswords[row.id].trim() !== "")) && (
              <button
                onClick={() => handleSaveRoleAndPassword(row.id)}
                style={{
                  padding: "4px 8px",
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (cellValue, row) => {
        if (!row || !row.id) return null;

        return (
          <button
            onClick={() => handleDelete(row.id)}
            style={{
              padding: "6px 12px",
              background: "#e53935",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        );
      },
    },
  ];

  const assignmentColumns = [
    {
      key: "supervisorName",
      title: "Supervisor",
      render: (cellValue, row) => {
        const supervisor = users.find((u) => u.id === row.supervisorId);
        return supervisor ? supervisor.fullname : "Unknown";
      },
    },
    {
      key: "driverName",
      title: "Driver",
      render: (cellValue, row) => {
        const driver = users.find((u) => u.id === row.driverId);
        return driver ? driver.fullname : "Unknown";
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (cellValue, row) => (
        <button
          onClick={() => handleRemoveAssignment(row.id)}
          style={{
            padding: "6px 12px",
            background: "#e53935",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Remove
        </button>
      ),
    },
  ];

  // Prepare supervisor list with entityName if available
  const supervisorListWithEntity = users
    .filter((u) => u.role === "supervisor")
    .map((su) => {
      // try to find a supervisors table row from supervisorAssignments or other source
      // If your /api/admin/users endpoint returns supervisor details (phone/entity), prefer that.
      // Here we attempt to enrich from a server-provided field `entityName` if present.
      return {
        ...su,
        phoneNumber: su.phoneNumber ?? su.phoneNumber ?? null,
        entityName: su.entityName ?? (su.entityId ? (entities.find((en) => en.id === su.entityId)?.name) : null),
      };
    });

  return (
    <div>
      <h1>User Management</h1>
      <p style={{ marginBottom: "16px" }}>
        Manage admin accounts, supervisors and drivers.
      </p>

      {/* Filter/Search */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by name or username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            flex: 1,
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            minWidth: "150px",
          }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="driver">Driver</option>
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: "#1976d2",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + Add User
        </button>
      </div>

      {/* User Table */}
      <div className="table-container">
        <Table columns={columns} data={filteredUsers} pagination={true} rowsPerPage={10} />
      </div>

      {/* Supervisor Assignments Section */}
      <div style={{ marginTop: "32px" }}>
        <h2>Supervisor-Driver Assignments</h2>
        <p style={{ marginBottom: "16px" }}>
          Assign drivers to supervisors for oversight.
        </p>
        <button
          onClick={() => setShowAssignmentModal(true)}
          style={{
            backgroundColor: "#1976d2",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          + Assign Supervisor
        </button>
        <div className="table-container">
          <Table columns={assignmentColumns} data={supervisorAssignments} pagination={true} rowsPerPage={10} />
        </div>
      </div>

      {/* Add User Modal */}
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
            onSubmit={handleAddUser}
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: 16 }}>Add New User</h3>
            <input
              type="text"
              name="fullname"
              placeholder="Full Name"
              required
              value={newUser.fullname}
              onChange={(e) =>
                setNewUser({ ...newUser, fullname: e.target.value })
              }
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            />
            <select
              name="role"
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value })
              }
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            >
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="driver">Driver</option>
            </select>

            {/* Extra supervisor fields */}
            {newUser.role === "supervisor" && (
              <>
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  required
                  value={newUser.phoneNumber}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phoneNumber: e.target.value })
                  }
                  style={{ width: "100%", padding: 8, marginBottom: 12 }}
                />

                <select
                  name="entityId"
                  value={newUser.entityId}
                  onChange={(e) =>
                    setNewUser({ ...newUser, entityId: e.target.value })
                  }
                  required
                  style={{ width: "100%", padding: 8, marginBottom: 12 }}
                >
                  <option value="">Select Entity</option>
                  {entities.map((en) => (
                    <option key={en.id} value={en.id}>
                      {en.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  // reset fields for safety
                  setNewUser({
                    fullname: "",
                    username: "",
                    password: "",
                    role: "admin",
                    phoneNumber: "",
                    entityId: "",
                  });
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
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Supervisor Modal */}
      {showAssignmentModal && (
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
            onSubmit={handleAssignSupervisor}
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: 16 }}>Assign Supervisor to Driver</h3>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            >
              <option value="">Select Supervisor</option>
              {users
                .filter((u) => u.role === "supervisor")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullname}
                  </option>
                ))}
            </select>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            >
              <option value="">Select Driver</option>
              {users
                .filter((u) => u.role === "driver")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullname}
                  </option>
                ))}
            </select>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => setShowAssignmentModal(false)}
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
                Assign
              </button>
            </div>
          </form>
        </div>
      )}




      {/* Supervisor Assignment Logs Section */}
<div style={{ marginTop: "32px" }}>
  <h2>Supervisor Assignment Logs</h2>
  <p style={{ marginBottom: "16px" }}>
    View all supervisor-driver assignments with vehicle info and timestamps.
  </p>
  <div className="table-container">
    <Table
      columns={[
        {
          key: "plateNumber",
          title: "Vehicle Plate",
          render: (cellValue, row) => row.plateNumber || "Unknown",
        },
        {
          key: "supervisorId",
          title: "Supervisor ID",
          render: (cellValue, row) => row.supervisorName,
        },
        {
          key: "driverId",
          title: "Driver ID",
          render: (cellValue, row) => row.driverName,
        },
        {
          key: "assignedAt",
          title: "Assigned At",
          render: (cellValue, row) =>
            new Date(row.assignedAt || row.createdAt).toLocaleString(),
        },
      ]}
      data={supervisionLogs}
      pagination={true}
      rowsPerPage={10}
    />
  </div>
</div>

  
    </div>



    );
};

export default UserManagement;
