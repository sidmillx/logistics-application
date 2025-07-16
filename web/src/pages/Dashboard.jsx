import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import CustomBarChart from "../components/BarChart";
import API_BASE_URL from "../config/config";
import { MapPin, Award, Car, Fuel, Banknote } from "lucide-react";

const Dashboard = () => {
  const [summary, setSummary] = useState({});
  const [driverUtilization, setDriverUtilization] = useState([]);
  const [vehicleUtilization, setVehicleUtilization] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, driverRes, vehicleRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/dashboard/summary`),
          fetch(`${API_BASE_URL}/api/admin/dashboard/driver-utilization`),
          fetch(`${API_BASE_URL}/api/admin/dashboard/vehicle-utilization`),
        ]);

        setSummary(await summaryRes.json());
        setDriverUtilization(await driverRes.json());
        setVehicleUtilization(await vehicleRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Top Summary Cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Trips" value={summary.totalTrips || 0} icon={<MapPin style={{ color: "ea580c" }}/>} />
        <Card title="Most Active Driver" value={summary.topDriver || "N/A"} icon={<Award style={{ color: "#16a34a" }}/>} />
        <Card title="Most Used Vehicle" value={summary.topVehicle || "N/A"} icon={<Car style={{ color: "ea580c" }}/>} />
      </div>

      {/* Utilization Charts */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <div style={chartCardStyle}>
          <h3>Driver Utilization</h3>
          <CustomBarChart data={driverUtilization} dataKey="trips" xKey="name" />
        </div>
        <div style={chartCardStyle}>
          <h3>Vehicle Utilization</h3>
          <CustomBarChart data={vehicleUtilization} dataKey="km" xKey="name" />
        </div>
      </div>

      {/* Fuel Efficiency Cards */}
      <div style={{ display: "flex", gap: "16px" }}>
        <Card title="Litres / 100km" value={`${summary.litresPer100Km || 0} L`} icon={<Fuel style={{ color: "#2563eb" }}/>} />
        <Card title="Cost per km" value={`E ${summary.costPerKm || 0}`} icon={<Banknote style={{ color: "#16a34a" }}/>} />
      </div>
    </div>
  );
};

const chartCardStyle = {
  flex: 1,
  background: "#fff",
  padding: "16px",
  borderRadius: "8px",
  boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
  border: "solid 1px #ccc",
};

export default Dashboard;
