import Card from "../components/Card";
import Table from "../components/Table";
import { Link } from "react-router-dom";
import editIcon from "../assets/icons/edit.svg";
import deleteIcon from "../assets/icons/delete.svg";
import fuelIcon from "../assets/icons/fuel.svg";
import carIcon from "../assets/icons/car_directions.svg";
import truckIcon from "../assets/icons/truck.svg";
import trafficIcon from "../assets/icons/traffic.svg";
import { useState, useEffect } from "react";
import API_BASE_URL from "../config/config";

import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

  const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState({
    totalVehicles: 0,
    available: 0,
    inUse: 0,
    fuelLoggedToday: 0,
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const [vehiclesRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/vehicles`),
          fetch(`${API_BASE_URL}/api/admin/vehicles/summary`), // Create this route
        ]);

        const vehiclesData = await vehiclesRes.json();
        const summaryData = await summaryRes.json();

        setVehicles(vehiclesData);
        setSummary(summaryData);
      } catch (err) {
        console.error("Failed to fetch vehicle data:", err);
      }
    };

    fetchVehicles();
  }, []);

  const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/vehicles/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('Failed to delete');

    // Update the UI
    setVehicles((prev) => prev.filter((v) => v.id !== id));

    toast.success('Vehicle deleted successfully');
  } catch (err) {
    console.error('Delete failed:', err);
    toast.error('Error deleting vehicle');
  }
};



  // const tableData = [
  //   { id: "TR208", status: "In Use", assignedDriver: "Bheki Dlamini", odometer: "27, 987 km", location: "Matsapha", lastUpdate: "2025-06-25" },
  //   { id: "TR209", status: "Available", assignedDriver: "Sandile Dlamini", odometer: "13, 456 km", location: "Mbabane", lastUpdate: "2025-06-24" },
  //   { id: "TR210", status: "In Use", assignedDriver: "Mlamuli M.", odometer: "45, 678 km", location: "Manzini", lastUpdate: "2025-06-23" },
  //   { id: "TR211", status: "In Use", assignedDriver: "Sive L.", odometer: "28, 123 km", location: "Nhlangano", lastUpdate: "2025-06-22" },
  //   { id: "TR212", status: "Available", assignedDriver: "Banele D.", odometer: "34, 890 km", location: "Siteki", lastUpdate: "2025-06-21" },
  //   { id: "TR213", status: "In Use", assignedDriver: "Thandiwe M.", odometer: "56, 789 km", location: "Hlatikulu", lastUpdate: "2025-06-20" },
  //   { id: "TR214", status: "Available", assignedDriver: "Sipho Nkosi", odometer: "22, 345 km", location: "Lobamba", lastUpdate: "2025-06-19" },
  //   { id: "TR215", status: "In Use", assignedDriver: "Lindiwe S.", odometer: "18, 456 km", location: "Piggs Peak", lastUpdate: "2025-06-18" },
  //   { id: "TR216", status: "Available", assignedDriver: "Musa M.", odometer: "30, 678 km", location: "Big Bend", lastUpdate: "2025-06-17" },
  // ];

//   const columns = [
//     { key: "id", title: "Vehicle ID" },
//     { key: "status", title: "Status" },
//     { key: "assignedDriver", title: "Assigned Driver" },
//     { key: "odometer", title: "Odometer" },
//     { key: "location", title: "Location" },
//     { key: "lastUpdate", title: "Last Update" },
//     {
//   key: "actions",
//   title: "Actions",
//   render: (row) => (
//     <div>
//         <Link to={`/vehicle/edit/${row.id}`} style={{marginRight: "15px"}}>
//           <button style={{border: "none", background: "transparent", cursor: "pointer"}}><span><img src={editIcon} alt="edit icon" /></span></button>
//         </Link>
//         <Link to={`/vehicle/${row.id}`} style={{marginRight: "15px"}}>
//           <button style={{border: "none", background: "transparent", cursor: "pointer"}}><span><img src={deleteIcon} alt="delete Icon" /></span></button>
//         </Link>
      
//         </div>
//   ),
// }
// ,
//   ];

const columns = [
  { key: "plateNumber", title: "Plate Number" },
  { key: "make", title: "Make" },
  { key: "model", title: "Model" },
  { key: "status", title: "Status" },
  { key: "createdAt", title: "Added On" },
  {
    key: "actions",
    title: "Actions",
    render: (row) => (
      <div>
        <Link to={`/vehicle/edit/${row.id}`} style={{ marginRight: "15px" }}>
          <button style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <img src={editIcon} alt="edit icon" />
          </button>
        </Link>
          <button
            onClick={() => handleDelete(row.id)}
            style={{ border: "none", background: "transparent", cursor: "pointer" }}
          >
            <img src={deleteIcon} alt="delete icon" />
          </button>
      </div>
    )
  }
];

  return (
    <div>
      <h1>Vehicle Management</h1>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card title="Total Vehicles" value={summary.totalVehicles} icon={<img src={truckIcon} alt="truck icon" />} />
        <Card title="Total Available Vehicles" value={summary.available} icon={<img src={carIcon} alt="available icon" />} />
        <Card title="Total Vehicles in Use" value={summary.inUse} icon={<img src={trafficIcon} alt="in use icon" />} />
        <Card title="Fuel Logged Today" value={summary.fuelLoggedToday} icon={<img src={fuelIcon} alt="fuel icon" />} />
      </div>



      <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 3px rgba(0,0,0,0.2)", marginTop: "50px",  border: "solid 1px #ccc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3>Manage Vehicles</h3>
          <Link to="/vehicles/add">
            <button style={{
              padding: "12px 16px",
              backgroundColor: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}>
              + Add Vehicle
            </button>
          </Link>
        </div>
        <Table columns={columns} data={vehicles} />
      </div>
    </div>
  );
};

export default VehicleManagement;
