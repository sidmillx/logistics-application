import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import CustomBarChart from "../components/BarChart";
import Table from "../components/Table";
import FilterButtons from "../components/FilterButtons";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/config";
import { Route, Users, BarChart3 } from "lucide-react"; // Assuming you have these icons in lucide-react

const DriverUtilization = () => {
  const [filter, setFilter] = useState("trips");
  const [summary, setSummary] = useState({ totalActiveDrivers: 0, totalTrips: 0, avgTripsPerDriver: 0 });
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      const url = `${API_BASE_URL}/api/admin/drivers/utilization/summary?_=${Date.now()}`
      console.log("Fetching driver utilization summary from:", url);
      const res = await fetch(url);
     
      const data = await res.json();

      console.log("Raw API response:", data);

      setSummary({
        totalActiveDrivers: parseInt(data.totalActiveDrivers, 10) || 0,
        totalTrips: parseInt(data.totalTrips, 10) || 0,
        avgTripsPerDriver: parseFloat(data.avgTripsPerDriver) || 0
      });
    };
    fetchSummary();

    const fetchDetails = async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/drivers/utilization/details`);
      const data = await res.json();
      setTableData(data);

      // Build monthly chart data from detail records
      // Example aggregates here; adjust based on backend returns
      setChartData(data.map(d => ({
        month: new Date().toLocaleString("default", { month: "short" }),
        trips: d.trips,
        hours: d.hours
      })));
    };
    fetchDetails();
  }, []);

  const columns = [
    { key: "name", title: "Driver Name" },
    { key: "trips", title: "Trips this month" },
    { key: "hours", title: "Hours Logged" },
    { key: "avgDistance", title: "AVG Distance per trip" },
    {
      key: "actions",
      title: "Actions",
      render: (cellData, row) => (
        <Link to={`/drivers/${row.id}`}>
          <button style={{ padding: "10px", background: "transparent", border: "none", color: "steelblue", cursor: "pointer" }}>
            View Details
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <h1>Driver Utilization</h1>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Drivers" value={summary.totalActiveDrivers.toString()} icon={<Users />} />
        <Card title="Total Trips" value={summary.totalTrips.toString()} icon={<Route />} />
        <Card title="AVG Trips per driver" value={summary.avgTripsPerDriver} icon={<BarChart3  />} />
      </div>

      <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ccc" }}>
        <h3>Driver Activity Over Time</h3>
        <CustomBarChart data={chartData} dataKey={filter} xKey="month" />
        <FilterButtons options={[{ label: "By Trips", value: "trips" }, { label: "By Hours", value: "hours" }]} active={filter} onChange={setFilter} />
      </div>

      <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", border: "1px solid #ccc" }}>
        <h3>Driver Performance</h3>
        <Table columns={columns} data={tableData} rowsPerPage={5} />
      </div>
    </div>
  );
};

export default DriverUtilization;
