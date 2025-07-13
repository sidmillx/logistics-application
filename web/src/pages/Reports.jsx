import { useState, useEffect } from "react";
import Table from "../components/Table";
import { saveAs } from "file-saver";
import { API_BASE_URL } from "../config/config";

const TABS = [
  { label: "Trip Reports", value: "trips" },
  { label: "Fuel Reports", value: "fuel" },
  { label: "Driver Reports", value: "drivers" },
  { label: "Vehicle Reports", value: "vehicles" },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("trips");
  const [filters, setFilters] = useState({
    driver: "",
    vehicle: "",
    entity: "",
    dateFrom: "",
    dateTo: "",
  });
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_BASE_URL}/api/admin/reports/${activeTab}?${params}`);
      const data = await res.json();
      setTableData(data.rows);
      setColumns(data.columns);
    };
    fetchData();
  }, [activeTab, filters]);

  const exportFile = async (type) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE_URL}/api/admin/reports/${activeTab}/export-${type}?${params}`);
    const blob = await res.blob();
    const ext = type === "excel" ? "csv" : "pdf";
    saveAs(blob, `${activeTab}-report.${ext}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Reports</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: "10px 16px",
              backgroundColor: activeTab === tab.value ? "#00204D" : "#eee",
              color: activeTab === tab.value ? "#fff" : "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Driver Name"
          value={filters.driver}
          onChange={e => handleChange("driver", e.target.value)}
        />
        <input
          type="text"
          placeholder="Vehicle Reg"
          value={filters.vehicle}
          onChange={e => handleChange("vehicle", e.target.value)}
        />
        <input
          type="text"
          placeholder="Entity"
          value={filters.entity}
          onChange={e => handleChange("entity", e.target.value)}
        />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => handleChange("dateFrom", e.target.value)}
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => handleChange("dateTo", e.target.value)}
        />
      </div>

      {/* Export Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => exportFile("pdf")}
          style={{ marginRight: "10px", backgroundColor: "#00204D", color: "#fff", padding: "8px 14px", border: "none", borderRadius: "4px" }}
        >
          Export PDF
        </button>
        <button
          onClick={() => exportFile("excel")}
          style={{ backgroundColor: "#00695c", color: "#fff", padding: "8px 14px", border: "none", borderRadius: "4px" }}
        >
          Export Excel
        </button>
      </div>

      {/* Table */}
      <Table columns={columns} data={tableData} rowsPerPage={10} />
    </div>
  );
};

export default Reports;
