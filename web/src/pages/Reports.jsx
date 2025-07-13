import { useState, useEffect } from "react";
import Table from "../components/Table";
import { saveAs } from "file-saver";
import API_BASE_URL from "../config/config";

const TABS = [
  { label: "Trip Reports", value: "trips" },
  { label: "Fuel Reports", value: "fuel" },
  { label: "Driver Reports", value: "drivers" },
  { label: "Vehicle Reports", value: "vehicles" },
];

const defaultFilters = {
  trips: { driver: "", vehicle: "", entity: "", dateFrom: "", dateTo: "" },
  fuel: { vehicle: "", dateFrom: "", dateTo: "" },
  drivers: { driver: "", dateFrom: "", dateTo: "" },
  vehicles: { vehicle: "", entity: "", dateFrom: "", dateTo: "" },
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  } catch {
    return "N/A";
  }
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return "N/A";
  return typeof value === "number"
    ? new Intl.NumberFormat().format(value)
    : value;
};

const formatText = (text) => {
  return text === null || text === undefined || text === ""
    ? "N/A"
    : text.toString();
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState("trips");
  const [filters, setFilters] = useState(defaultFilters["trips"]);
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (filtersToUse) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(`${API_BASE_URL}/api/admin/reports/${activeTab}?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (!data?.columns || !data?.rows) throw new Error("Invalid data format from server");

      const formattedColumns = data.columns.map((col) => ({
        ...col,
        accessor: col.key,
        Cell: ({ value }) => {
          if (col.type === "date") return formatDate(value);
          if (col.type === "number") return formatNumber(value);
          return formatText(value);
        },
      }));

      setColumns(formattedColumns);
      setTableData(data.rows || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load data");
      setTableData([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFilters = defaultFilters[activeTab];
    setFilters(initialFilters);
    loadData(initialFilters);
  }, [activeTab]);

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const exportFile = async (type) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(
        `${API_BASE_URL}/api/admin/reports/${activeTab}/export-${type}?${params}`
      );

      if (!res.ok) throw new Error(`Export failed with status ${res.status}`);
      const blob = await res.blob();
      const ext = type === "excel" ? "xlsx" : "pdf";
      saveAs(blob, `${activeTab}-report.${ext}`);
    } catch (err) {
      console.error("Export failed:", err);
      setError(err.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Reports</h1>

      {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
      {loading && <div style={{ marginBottom: "10px" }}>Loading...</div>}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            disabled={loading}
            style={{
              padding: "10px 16px",
              backgroundColor: activeTab === tab.value ? "#00204D" : "#eee",
              color: activeTab === tab.value ? "#fff" : "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        {filters.driver !== undefined && (
          <input
            type="text"
            placeholder="Driver"
            value={filters.driver}
            onChange={(e) => handleChange("driver", e.target.value)}
          />
        )}
        {filters.vehicle !== undefined && (
          <input
            type="text"
            placeholder="Vehicle"
            value={filters.vehicle}
            onChange={(e) => handleChange("vehicle", e.target.value)}
          />
        )}
        {filters.entity !== undefined && (
          <input
            type="text"
            placeholder="Entity"
            value={filters.entity}
            onChange={(e) => handleChange("entity", e.target.value)}
          />
        )}
        {filters.dateFrom !== undefined && (
          <div>
            <label>From: </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleChange("dateFrom", e.target.value)}
            />
          </div>
        )}
        {filters.dateTo !== undefined && (
          <div>
            <label>To: </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleChange("dateTo", e.target.value)}
            />
          </div>
        )}
        <button onClick={() => loadData(filters)} disabled={loading}>
          Search
        </button>
      </div>

      {/* Export buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => exportFile("pdf")}
          disabled={loading}
          style={{
            marginRight: "10px",
            backgroundColor: "#00204D",
            color: "#fff",
            padding: "8px 14px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Export PDF
        </button>
        <button
          onClick={() => exportFile("excel")}
          disabled={loading}
          style={{
            backgroundColor: "#00695c",
            color: "#fff",
            padding: "8px 14px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Export Excel
        </button>
      </div>

      {/* Table */}
      {tableData.length > 0 ? (
        <Table columns={columns} data={tableData} rowsPerPage={10} isLoading={loading} />
      ) : (
        !loading && <div>No data available for the selected filters</div>
      )}
    </div>
  );
};

export default Reports;
