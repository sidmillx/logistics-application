import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import CustomBarChart from "../components/BarChart";
import Table from "../components/Table";
import FilterButtons from "../components/FilterButtons";
import { Link } from "react-router-dom";
import accountCircleIcon from "../assets/icons/account_circle.svg";
import locationIcon from "../assets/icons/location.svg";
import chartIcon from "../assets/icons/chart.svg";

const DriverUtilization = () => {
  const [filter, setFilter] = useState("trips");
  const [summary, setSummary] = useState({ totalActiveDrivers: 0, totalTrips: 0, avgTripsPerDriver: 0 });
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      const res = await fetch("http://localhost:5000/api/admin/drivers/utilization/summary");
      const data = await res.json();
      setSummary(data);
    };
    fetchSummary();

    const fetchDetails = async () => {
      const res = await fetch("http://localhost:5000/api/admin/drivers/utilization/details");
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
      render: (row) => (
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
        <Card title="Total Active Drivers" value={summary.totalActiveDrivers} icon={<img src={accountCircleIcon} alt="" />} />
        <Card title="Total Trips" value={summary.totalTrips} icon={<img src={locationIcon} alt="" />} />
        <Card title="AVG Trips per driver" value={summary.avgTripsPerDriver} icon={<img src={chartIcon} alt="" />} />
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
