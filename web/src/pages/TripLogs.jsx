import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import API_BASE_URL from "../config/config";

const TripLogs = () => {
  const [search, setSearch] = useState("");
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [stats, setStats] = useState({ totalTrips: 0, avgDistance: 0, avgFuel: 0 });

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
            id: trip.id,
            driverName: trip.driverName, // Changed from fullname to driverName
            vehiclePlate: trip.vehiclePlate, // Using plate number instead of vehicleId
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
        trip.vehiclePlate.toLowerCase().includes(keyword) || // Updated to vehiclePlate
        trip.startLocation.toLowerCase().includes(keyword) ||
        trip.endLocation.toLowerCase().includes(keyword)
    );
    setFilteredTrips(filtered);
  }, [search, trips]);

  const columns = [
    { key: "driverName", title: "Driver Name" },
    { key: "vehiclePlate", title: "Vehicle Plate" }, // Updated column title
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
          title="Download Receipt"
          style={{ background: "transparent", border: "none" }}
          onClick={() => {
            if (row.receiptUrl) window.open(row.receiptUrl, "_blank");
            else alert("Receipt not available");
          }}
        >
          <img src="/icons/download.svg" alt="Download" />
        </button>
      )
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Trip Logs</h1>

      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Trips" value={stats.totalTrips} />
        <Card title="Average Trip Distance" value={`${stats.avgDistance} KM`} />
        <Card title="Average Fuel per Trip" value={`E ${stats.avgFuel}`} />
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