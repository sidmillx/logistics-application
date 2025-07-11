// src/pages/Dashboard.jsx
import React from "react";
import Card from "../components/Card";
import CustomBarChart from "../components/BarChart";

const Dashboard = () => {
  // Example data for driver utilization
  const driverUtilizationData = [
    { name: "Banele D", trips: 240 },
    { name: "Driver 2", trips: 180 },
    { name: "Driver 3", trips: 150 },
    { name: "Driver 4", trips: 120 },
  ];

  // Example data for vehicle utilization
  const vehicleUtilizationData = [
    { name: "CR129", km: 4500 },
    { name: "CR130", km: 3200 },
    { name: "CR131", km: 2900 },
    { name: "CR132", km: 1500 },
  ];

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Top summary cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Trips" value="1245" icon="🚌" />
        <Card title="Most Active Driver" value="Banele D (240 trips)" icon="👤" />
        <Card title="Most Used Vehicle" value="CR129 (4,500 km)" icon="🚚" />
      </div>

      {/* Utilization charts */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Driver Utilization Chart */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
            border: "solid 1px #ccc",
          }}
        >
          <h3>Driver Utilization</h3>
          <CustomBarChart
            data={driverUtilizationData}
            dataKey="trips"
            xKey="name"
          />
        </div>

        {/* Vehicle Utilization Chart */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
            border: "solid 1px #ccc",
          }}
        >
          <h3>Vehicle Utilization</h3>
          <CustomBarChart
            data={vehicleUtilizationData}
            dataKey="km"
            xKey="name"
          />
        </div>
      </div>

      {/* Fuel Efficiency Cards */}
      <div style={{ display: "flex", gap: "16px" }}>
        <Card title="Litres / 100km" value="84 L" icon="⛽" />
        <Card title="Cost per km" value="E 49.50" icon="💰" />
      </div>
    </div>
  );
};

export default Dashboard;
