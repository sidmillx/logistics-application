import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import { Link } from "react-router-dom";
import editIcon from "../assets/icons/edit.svg";
import deleteIcon from "../assets/icons/delete.svg";

const Entities = () => {
  const [summary, setSummary] = useState({ totalEntities: 0, totalVehicles: 0, availableVehicles: 0 });
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this entity?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/entities/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      // Optional: show a toast or success message

      // Update UI
      setTableData(prev => prev.filter(e => e.id !== id));
      const summaryRes = await fetch("http://localhost:5000/api/admin/summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData);
    } catch (err) {
      console.error("Error deleting entity:", err);
      alert("Failed to delete entity");
    }
  };


  // Fetch both summary and entity-wise stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, entityStatsRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/summary"),
          fetch("http://localhost:5000/api/admin/entities/overview")
        ]);

        const summaryData = await summaryRes.json();
        const entityStats = await entityStatsRes.json();

        setSummary(summaryData);
        setTableData(entityStats.entitySummaries);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    { key: "name", title: "Entity Name" },
    { key: "totalVehicles", title: "Total Vehicles" },
    { key: "vehiclesInUse", title: "Vehicles in Use" },
    { key: "vehiclesAvailable", title: "Vehicles Available" },
    { key: "underMaintenance", title: "Vehicles Under Maintenance" },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div>
          <Link to={`/entity/edit/${row.id}`} style={{ marginRight: "15px" }}>
            <button style={{ border: "none", background: "transparent", cursor: "pointer" }}>
              <img src={editIcon} alt="edit icon" />
            </button>
          </Link>
            <button onClick={() => handleDelete(row.id)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
              <img src={deleteIcon} alt="delete icon" />
            </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Entity Management</h1>

      {loading ? (
        <p style={{ fontStyle: "italic", color: "#888" }}>Loading data...</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <Card title="Total Entities" value={summary.totalEntities} icon="👥" />
            <Card title="Total Vehicles Across Entities" value={summary.totalVehicles} icon="📍" />
            <Card title="Vehicles Available" value={summary.availableVehicles} icon="📈" />
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3>Manage Entities</h3>
              <Link to="/entities/add">
                <button
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
              </Link>
            </div>
            {console.log("Rendering tableData:", tableData)}

            {Array.isArray(tableData) && (
              tableData.length > 0 ? (
                <Table columns={columns} data={tableData} />
              ) : (
                <p style={{ fontStyle: "italic", color: "#888" }}>No entities to display.</p>
              )
            )}


          </div>
        </>
      )}
    </div>
  );
};

export default Entities;
