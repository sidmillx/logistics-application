import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../components/Card";
import Table from "../components/Table";

const DriverDetails = () => {
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/admin/drivers/${id}`)
      .then(res => res.json())
      .then(data => setDriver(data));

    fetch(`http://localhost:5000/api/admin/drivers/${id}/recent-trips`)
      .then(res => res.json())
      .then(data => setTrips(data));
  }, [id]);

  const columns = [
    { key: "date", title: "Date" },
    { key: "route", title: "Route" },
    { key: "distance", title: "Distance" },
    { key: "duration", title: "Duration" },
    { key: "status", title: "Status" },
  ];

  if (!driver) return <p>Loading driver details...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Driver Details</h1>

      {/* Profile Card */}
      <div style={{
        background: "#eee", borderRadius: "8px", padding: "20px", display: "flex", alignItems: "center", marginBottom: "20px"
      }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%", background: "#ccc", marginRight: "20px"
        }}></div>
        <div>
          <h3>{driver.name}</h3>
          <p>{driver.company}</p>
          <p>{driver.phone}</p>
        </div>
      </div>

      {/* Performance Overview */}
      <h3>Performance Overview</h3>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Trips this month" value={driver.totalTrips} icon="📍" />
        <Card title="Hours Logged" value={driver.hoursLogged} icon="🕒" />
        <Card title="AVG dist per trip" value={driver.avgDistance} icon="📈" />
      </div>

      {/* Recent Trips */}
      <div style={{ background: "#fff", padding: "16px", borderRadius: "8px" }}>
        <h3>Recent Trips</h3>
        <Table columns={columns} data={trips} />
      </div>
    </div>
  );
};

export default DriverDetails;
