import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import downloadIcon from "../assets/icons/download.svg";
import { Link } from "react-router-dom";

const TripLogs = () => {
  const [search, setSearch] = useState("");
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({ totalTrips: 0, avgDistance: 0, avgFuel: 0 });

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/trips/logs");
        const data = await res.json();
        // Expected backend array with fields: id, fullname, vehicleId, locationStart, locationEnd, odometerStart, odometerEnd, checkInTime, checkOutTime, fuelCost, receiptUrl
        const formatted = data.map(trip => {
          const dist = trip.odometerEnd - trip.odometerStart;
          const durMs = new Date(trip.checkOutTime) - new Date(trip.checkInTime);
          const hours = Math.floor(durMs / 3600000);
          const minutes = Math.floor((durMs % 3600000) / 60000);
          return {
            id: trip.id,
            driverName: trip.fullname,
            vehicleReg: trip.vehicleId,
            startLocation: trip.locationStart,
            endLocation: trip.locationEnd,
            distance: `${dist} km`,
            duration: `${hours}h ${minutes}m`,
            date: new Date(trip.checkOutTime).toLocaleDateString(),
            fuelUsed: `${trip.fuelCost} E`,
            receiptUrl: trip.receiptUrl // for later download
          };
        });

        setTrips(formatted);
        setStats({
          totalTrips: formatted.length,
          avgDistance: (formatted.reduce((sum, t) => sum + parseInt(t.distance), 0) / formatted.length).toFixed(1),
          avgFuel: (formatted.reduce((sum, t) => sum + parseInt(t.fuelUsed), 0) / formatted.length).toFixed(1)
        });
      } catch (err) {
        console.error("Failed to fetch trip logs:", err);
      }
    };
    fetchTrips();
  }, []);

  const columns = [
    { key: "driverName", title: "Driver Name" },
    { key: "vehicleReg", title: "Vehicle Reg" },
    { key: "startLocation", title: "Start Location" },
    { key: "endLocation", title: "End Location" },
    { key: "distance", title: "Distance" },
    { key: "duration", title: "Duration" },
    { key: "date", title: "Date" },
    { key: "fuelUsed", title: "Fuel Cost" },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) => (
        <button
          title="Download Receipt"
          style={{ background: "transparent", border: "none" }}
          onClick={() => {
            // for now placeholder logic: open receipt URL or alert
            if (row.receiptUrl) window.open(row.receiptUrl);
            else alert("Receipt not available");
          }}
        >
          <img src={downloadIcon} alt="Download" />
        </button>
      )
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Trip Logs</h1>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Trips" value={stats.totalTrips} />
        <Card title="Average Trip Distance" value={`${stats.avgDistance} KM`} />
        <Card title="Average Fuel per Trip" value={`${stats.avgFuel} E`} />
      </div>

      {/* Filters */}
      {/* ... unchanged ... */}

      <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "20px", boxShadow: "...", border: "1px solid #ccc" }}>
        <h3>Trip Logs</h3>
        <Table columns={columns} data={trips} />
      </div>
    </div>
  );
};

export default TripLogs;
