import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import API_BASE_URL from "../config/config";
import { Route, Map, Fuel } from "lucide-react"; // Assuming you have these icons in lucide-react

const TripLogs = () => {
  const [search, setSearch] = useState("");
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [stats, setStats] = useState({ totalTrips: 0, avgDistance: 0, avgFuel: 0 });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/trips/logs`);
        const data = await res.json();

        const formatted = data.map(trip => {
          const dist = trip.odometerEnd - trip.odometerStart;
          const durMs = new Date(trip.checkOutTime) - new Date(trip.checkInTime);
          const hours = Math.floor(durMs / 3600000);
          const minutes = Math.floor((durMs % 3600000) / 60000);
          return {
            ...trip,
            id: trip.id,
            driverName: trip.driverName,
            vehiclePlate: trip.vehiclePlate,
            startLocation: trip.locationStart,
            endLocation: trip.locationEnd,
            distance: dist,
            duration: `${hours}h ${minutes}m`,
            date: new Date(trip.checkOutTime).toLocaleDateString(),
            fuelUsed: trip.fuelCost,
            receiptUrl: trip.receiptUrl
          };
        });

        setTrips(formatted);
        setFilteredTrips(formatted);
        setStats({
          totalTrips: formatted.length,
          avgDistance: (formatted.reduce((sum, t) => sum + t.distance, 0) / formatted.length || 0).toFixed(1),
          avgFuel: (formatted.reduce((sum, t) => sum + t.fuelUsed, 0) / formatted.length || 0).toFixed(1)
        });
      } catch (err) {
        console.error("Failed to fetch trip logs:", err);
      }
    };

    fetchTrips();
  }, []);

  useEffect(() => {
    const keyword = search.toLowerCase();
    const filtered = trips.filter(
      trip =>
        trip.driverName.toLowerCase().includes(keyword) ||
        trip.vehiclePlate.toLowerCase().includes(keyword) ||
        trip.startLocation.toLowerCase().includes(keyword) ||
        trip.endLocation.toLowerCase().includes(keyword)
    );
    setFilteredTrips(filtered);
  }, [search, trips]);

  const handleDownload = async (receiptUrl, driverName, date) => {
    if (!receiptUrl) {
      alert("No receipt available for this trip");
      return;
    }

    setDownloading(true);
    try {
      // Create a more descriptive filename
      const fileName = `receipt_${driverName.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.${receiptUrl.split('.').pop()}`;
      
      // Method 1: Direct download (works for most modern browsers)
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: Open in new tab if download fails
      window.open(receiptUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const columns = [
    { key: "driverName", title: "Driver Name" },
    { key: "vehiclePlate", title: "Vehicle Plate" },
    { key: "startLocation", title: "Start Location" },
    { key: "endLocation", title: "End Location" },
    { key: "distance", title: "Distance", render: (cellData, row) => `${row.distance} km` },
    { key: "duration", title: "Duration" },
    { key: "date", title: "Date" },
    { key: "fuelUsed", title: "Fuel Cost", render: (cellData, row) => `E ${row.fuelUsed}` },
    {
      key: "receipt",
      title: "Receipt",
      render: (cellData, row) => (
        <button
          title={row.receiptUrl ? "Download Receipt" : "No receipt available"}
          style={{ 
            background: "transparent", 
            border: "none",
            cursor: row.receiptUrl ? "pointer" : "not-allowed",
            opacity: row.receiptUrl ? 1 : 0.5
          }}
          onClick={() => handleDownload(row.receiptUrl, row.driverName, row.date)}
          disabled={!row.receiptUrl || downloading}
        >
          {downloading ? (
            <span>Downloading...</span>
          ) : (
            <img 
              src="/icons/download.svg" 
              alt="Download" 
              style={{ width: "20px", height: "20px" }} 
            />
          )}
        </button>
      )
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Trip Logs</h1>

      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Trips" value={stats.totalTrips} icon={<Route />}/>
        <Card title="Average Trip Distance" value={`${stats.avgDistance} KM`} icon={<Map/>}/>
        <Card title="Average Fuel per Trip" value={`E ${stats.avgFuel}`} icon={<Fuel />}/>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search driver, vehicle or location..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px"
          }}
        />
      </div>

      <div style={{
        background: "#fff",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        border: "1px solid #ccc"
      }}>
        <h3 style={{ marginBottom: "12px" }}>Trip Logs</h3>
        <Table columns={columns} data={filteredTrips} />
      </div>
    </div>
  );
};

export default TripLogs;