import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import CustomBarChart from "../components/BarChart";
import Table from "../components/Table";
import FilterButtons from "../components/FilterButtons";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/config";
import { Fuel, Banknote } from "lucide-react"; // Assuming you have these icons in lucide-react

const FuelUtilization = () => {
  const [filter, setFilter] = useState("litres");
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
  const fetchAll = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [sumRes, chartRes, tableRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/fuel-utilization/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/fuel-utilization/chart?groupBy=${filter}`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/fuel-utilization/table`, { headers }),
      ]);

      if (!sumRes.ok || !chartRes.ok || !tableRes.ok) {
        throw new Error("Failed to fetch one or more fuel utilization endpoints");
      }

      setSummary(await sumRes.json());
      setChartData(await chartRes.json());
      setTableData(await tableRes.json());
    } catch (err) {
      console.error("Error fetching fuel utilization data:", err);
    }
  };

  fetchAll();
}, [filter]);


  const columns = [
    { key: "vehicleReg", title: "Vehicle" },
    { key: "entityName", title: "Entity" },
    { key: "totalLitresUsed", title: "Total Litres Used" },
    { key: "avgKmPerLitre", title: "Average Km/l" },
    { key: "fuelCost", title: "Fuel Cost" },
    { key: "actions", title: "Actions", render: (cellValue, row) => (
      <Link to={`/vehicles/${row.id}/fuel`}>
        <button className="link-button" style={{ padding: "10px", background: "transparent", border: "none", color: "steelblue", cursor: "pointer" }}>View Fuel Logs</button>
      </Link>
    )},
  ];

  return (
    <div>
      <h1>Fuel Utilization</h1>
      <div className="cards" style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Litres Consumed" value={`${summary.totalLitres ?? 0} L`} icon={<Fuel />} />
        <Card title="AVG Litres / Trip" value={`${summary.avgLitresPerTrip ?? 0} L`} icon={<Fuel />} />
        <Card title="Total Fuel Cost" value={`E${summary.totalCost ?? 0}`} icon={<Banknote />} />
        <Card title="AVG Cost / Km" value={`E${summary.avgCostPerKm ?? 0}`} icon={<Banknote />} />
      </div>

       <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <section style={{
            flex: 1,
            background: "#fff",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
            border: "solid 1px #ccc",
          }}>
          <h3>Fuel over Time</h3>
          <CustomBarChart data={chartData} dataKey={filter} xKey="month" />
          <FilterButtons options={[
            { label: "By litres", value: "litres" },
            { label: "By hours", value: "hours" },
          ]} active={filter} onChange={setFilter} />
        </section>
        <section style={{
            flex: 1,
            background: "#fff",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
            border: "solid 1px #ccc",
          }}>
          <h3>Trips by Entity</h3>
          <CustomBarChart data={chartData /* or separate endpoint */} dataKey={filter} xKey="entityName" />
          <FilterButtons
            options={[
              { label: "By litres", value: "litres" },
              { label: "By hours", value: "hours" },
            ]}
            active={filter}
            onChange={setFilter}
          />

        </section>
      </div>

      <div className="table-container">
        <h3>Vehicle Fuel Stats</h3>
        <Table columns={columns} data={tableData} rowsPerPage={5} />
      </div>
    </div>
  );
};

export default FuelUtilization;
