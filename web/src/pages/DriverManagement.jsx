import Card from "../components/Card";
import Table from "../components/Table";
import { Link } from "react-router-dom";
import editIcon from "../assets/icons/edit.svg";
import deleteIcon from "../assets/icons/delete.svg";
import personIcon from "../assets/icons/person_pin_circle.svg";
import groupIcon from "../assets/icons/groups.svg";
import barchartIcon from "../assets/icons/barchart.svg";
import { useState, useEffect } from "react";


const DriverManagement = () => {

  // State to hold driver data
  const [drivers, setDrivers] = useState([]);
  // State to hold summary data
   const [summary, setSummary] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    avgTripsPerDriver: 0,
  });

  // Fetch drivers and summary on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Adjust these URLs to match your backend endpoints
        const [driversRes, summaryRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/drivers"),          // Fetch driver list
          fetch("http://localhost:5000/api/admin/drivers/summary"),  // Fetch summary stats
        ]);

        if (!driversRes.ok || !summaryRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const driversData = await driversRes.json();
        const summaryData = await summaryRes.json();

        setDrivers(driversData);
        setSummary({
          totalDrivers: summaryData.totalDrivers,
          activeDrivers: summaryData.activeDrivers,
          avgTripsPerDriver: summaryData.avgTripsPerDriver,
        });
      } catch (err) {
        console.error("Error loading drivers data:", err);
      }
    };

    fetchData();
  }, []);

 const handleDelete = async (id) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this driver?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`http://localhost:5000/api/admin/drivers/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Delete failed");

    // Remove from state
    setDrivers((prev) => prev.filter((d) => d.id !== id));

  } catch (err) {
    console.error("Failed to delete driver:", err);
    alert("Failed to delete driver");
  }
};



  // const tableData = [
  //   { name: "Sandile Zwane", status: "In Use", entity: "Inyatsi", contact: "76547382"},
  //   { name: "Bheki Dlamini", status: "Available", entity: "Inyatsi", contact: "76547382" },
  //   { name: "Mlamuli M.", status: "In Use", entity: "Inyatsi", contact: "76547382" },
  //   { name: "Sipho Nkosi", status: "Available", entity: "Inyatsi", contact: "76547382" },
  //   { name: "Lindiwe S.", status: "In Use", entity: "Inyatsi", contact: "76547382" },
  //   { name: "Musa M.", status: "Available", entity: "Inyatsi", contact: "76547382" },
  // ];

  const columns = [
    { key: "name", title: "Driver Name" },
    { key: "entityName", title: "Entity" },
    { key: "contact", title: "Contact" },
    { key: "status", title: "Status" },
   
    {
  key: "actions",
  title: "Actions",
  render: (row) => (
    <div>
    <Link to={`/drivers/edit/${row.id}`} style={{marginRight: "15px"}}>
      <button style={{border: "none", background: "transparent", cursor: "pointer"}}><span><img src={editIcon} alt="edit icon" /></span></button>
    </Link>
      <button onClick={() => handleDelete(row.id)} style={{border: "none", background: "transparent", cursor: "pointer"}}><span><img src={deleteIcon} alt="delete Icon" /></span></button>
  
    </div>
    
  ),
}
,
  ];

  return (
    <div>
      <h1>Driver Management</h1>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <Card
          title="Total Drivers"
          value={summary.totalDrivers}
          icon={<span><img src={groupIcon} alt="person icon" /></span>}
        />
        <Card title="Active Drivers" value={summary.activeDrivers}  icon={<span><img src={personIcon} alt="person icon" /></span>} />
        <Card title="Avg Trip per Driver" value={summary.avgTripsPerDriver}  icon={<span><img src={barchartIcon} alt="barchart icon" /></span>}  />
      </div>


      {/* <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 3px rgba(0,0,0,0.2), 0 5px 12px rgba(0,0,0,0.2)" }}> */}
      <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", border: "solid 1px #ccc" , boxShadow: "0 2px 3px rgba(0,0,0,0.2)" }}>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3>Manage Drivers</h3>
          <Link to="/drivers/add">
            <button style={{
              padding: "12px 16px",
              backgroundColor: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}>
              + Add Driver
            </button>
          </Link>
        </div>
         <Table columns={columns} data={drivers} />
      </div>
    </div>
  );
};

export default DriverManagement;
