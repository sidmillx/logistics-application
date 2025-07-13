import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../components/Card";
import Table from "../components/Table";
import API_BASE_URL from "../config/config";

const DriverDetails = () => {
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [driverRes, tripsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/drivers/${id}`),
          fetch(`${API_BASE_URL}/api/admin/drivers/${id}/recent-trips`)
        ]);

        if (!driverRes.ok) throw new Error('Failed to fetch driver details');
        if (!tripsRes.ok) throw new Error('Failed to fetch trips');

        const driverData = await driverRes.json();
        const tripsData = await tripsRes.json();

        console.log('Raw tripsData:', tripsData);


        // Format trip data directly
        const formattedTrips = tripsData.map(trip => {
          // Format date if it exists
          const date = trip.date ? new Date(trip.date).toLocaleDateString() : 'N/A';
          
          // Format distance (assuming it's in km)
          const distance = typeof trip.distance === 'number' ? 
            `${trip.distance.toFixed(1)} km` : 'N/A';
          
          // Format duration (assuming it's in hours)
          let duration = 'N/A';
          if (typeof trip.duration === 'number') {
            const hours = Math.floor(trip.duration);
            const minutes = Math.round((trip.duration - hours) * 60);
            duration = `${hours}h ${minutes}m`;
          }
          
          return {
            ...trip,
            date,
            distance,
            duration,
            status: trip.status || 'Completed'
          };
        });

        setDriver(driverData);
        setTrips(formattedTrips);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const columns = [
    { 
      key: "date", 
      title: "Date",
      width: "120px"
    },
    { 
      key: "route", 
      title: "Route"
    },
    { 
      key: "distance", 
      title: "Distance",
      align: "right"
    },
    { 
      key: "duration", 
      title: "Duration",
      align: "right"
    },
    { 
      key: "status", 
      title: "Status",
      render: (value) => (
        <span style={{
          padding: "4px 8px",
          borderRadius: "12px",
          backgroundColor: value === 'Completed' ? '#e6f7ee' : '#fff3e6',
          color: value === 'Completed' ? '#00a854' : '#fa8c16',
          fontSize: "14px"
        }}>
          {value}
        </span>
      )
    },
  ];

  if (loading) return <div style={{ padding: "20px" }}>Loading driver details...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>Error: {error}</div>;
  if (!driver) return <div style={{ padding: "20px" }}>No driver data found</div>;

  // Format driver stats directly
  const formatStat = (value, isDistance = false) => {
    if (value === undefined || value === null) return 'N/A';
    if (isDistance) return `${value.toFixed(1)} km`;
    return value.toString();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "24px" }}>Driver Details</h1>

      {/* Profile Card */}
      <div style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "24px",
        display: "flex",
        alignItems: "center",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "#f0f2f5",
          marginRight: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#00204D"
        }}>
          {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
        </div>
        <div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>
            {driver.name || 'Unknown Driver'}
          </h3>
          <div style={{ display: "flex", gap: "16px", color: "#666", flexWrap: "wrap" }}>
            {driver.phone && <span>📱 {driver.phone}</span>}
            {driver.company && <span>🏢 {driver.company}</span>}
            {driver.email && <span>✉️ {driver.email}</span>}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <h3 style={{ marginBottom: "16px" }}>Performance Overview</h3>
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <Card 
          title="Total Trips" 
          value={driver.totalTrips ? driver.totalTrips.toString() : 'N/A'} 
        />
        <Card 
          title="Hours Logged" 
          value={driver.hoursLogged ? driver.hoursLogged.toString() : 'N/A'} 
        />
        <Card 
          title="Total Distance" 
          value={formatStat(driver.totalDistance, true)} 
        />
        <Card 
          title="Avg. Distance" 
          value={formatStat(driver.avgDistance, true)} 
        />
      </div>

      {/* Recent Trips */}
      <div style={{ 
        background: "#fff", 
        padding: "24px", 
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ margin: "0 0 16px 0" }}>Recent Trips</h3>
        
        {trips.length > 0 ? (
          <Table 
            columns={columns} 
            data={trips} 
            style={{ width: "100%" }}
          />
        ) : (
          <div style={{ 
            padding: "40px", 
            textAlign: "center", 
            color: "#666"
          }}>
            No recent trips found
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDetails;