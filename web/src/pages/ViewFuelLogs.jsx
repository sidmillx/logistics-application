import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import fuelIcon from "../assets/icons/fuel.svg";
import chartIcon from "../assets/icons/chart.svg";
import { useParams, Link } from "react-router-dom";

const ViewFuelLogs = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehicleRes, logsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/admin/vehicles/${id}`),
          fetch(`http://localhost:5000/api/admin/vehicles/${id}/fuel-logs`),
        ]);

        if (!vehicleRes.ok || !logsRes.ok) throw new Error("Fetch failed");

        const vehicleData = await vehicleRes.json();
        const logsData = await logsRes.json();

        setVehicle(vehicleData);
        setLogs(logsData);
      } catch (err) {
        console.error("Error fetching fuel logs:", err);
      }
    };

    fetchData();
  }, [id]);

  const columns = [
    { key: "date", title: "Date", render: (row) => new Date(row.date).toLocaleDateString() },
    { key: "fuelType", title: "Fuel Type" },
    { key: "liters", title: "Litres" },
    { key: "cost", title: "Cost (E)" },
    { key: "odometer", title: "Odometer (km)" },
    { key: "loggedBy", title: "Logged By" },
  ];

  const summary = {
    totalLitres: logs.reduce((sum, log) => sum + parseFloat(log.liters || 0), 0),
    totalCost: logs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0),
  };

  return (
    <div>
      <h1>Fuel Logs</h1>

      <div className="cards" style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Litres Used" value={`${summary.totalLitres.toFixed(2)} L`} icon={<img src={fuelIcon} />} />
        <Card title="Total Cost" value={`E${summary.totalCost.toFixed(2)}`} icon={<img src={chartIcon} />} />
        <Card title="Vehicle" value={vehicle?.plateNumber || "..."} icon={<img src={chartIcon} />} />
      </div>

      <div className="table-container">
        <h3>Fuel Log Entries</h3>
        <Table columns={columns} data={logs} rowsPerPage={10} />
      </div>

      <Link to="/vehicles">
        <button
          style={{
            marginTop: "24px",
            padding: "10px 20px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Back to Vehicle Management
        </button>
      </Link>
    </div>
  );
};

export default ViewFuelLogs;
