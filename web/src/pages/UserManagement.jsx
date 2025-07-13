import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { toast } from "react-toastify";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingRoles, setEditingRoles] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullname: "",
    username: "",
    password: "",
    role: "admin",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load users");
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
          user.fullname.toLowerCase().includes(lower) ||
          user.username.toLowerCase().includes(lower)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = (id, newRole) => {
    setEditingRoles((prev) => ({ ...prev, [id]: newRole }));
  };

  const handleSaveRole = async (id) => {
    const newRole = editingRoles[id];
    if (!newRole) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      toast.success("Role updated");
      setEditingRoles((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      fetchUsers();
    } catch (err) {
      toast.error("Error updating role");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("User removed");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      toast.error("Error deleting user");
      console.error(err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) throw new Error("Failed to add user");

      toast.success("User added successfully");
      setShowAddModal(false);
      setNewUser({ fullname: "", username: "", password: "", role: "admin" });
      fetchUsers();
    } catch (err) {
      toast.error("Failed to add user");
      console.error(err);
    }
  };

  const columns = [
    { key: "fullname", title: "Name" },
    { key: "username", title: "Username" },
    {
      key: "role",
      title: "Role",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={editingRoles[row.id] || row.role}
            onChange={(e) => handleRoleChange(row.id, e.target.value)}
            style={{ padding: "4px" }}
          >
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="driver">Driver</option>
          </select>
          {editingRoles[row.id] && (
            <button
              onClick={() => handleSaveRole(row.id)}
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
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
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
      ),
    },
  ];

  return (
    <div>
      <h1>User Management</h1>
      <p style={{ marginBottom: "16px" }}>
        Manage admin accounts and assign roles.
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
        <Table columns={columns} data={filteredUsers} rowsPerPage={5} />
      </div>

      {/* Modal Form */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
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
              minWidth: 300,
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
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
