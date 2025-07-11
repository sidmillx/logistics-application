import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
// import Header from './components/Header';

// Import all pages
import Dashboard from './pages/Dashboard';
import DriverManagement from './pages/DriverManagement';
import VehicleManagement from './pages/VehicleManagement';
import TripLogs from './pages/TripLogs';
import Entities from './pages/Entities';
import DriverUtilization from './pages/DriverUtilization';
import FuelUtilization from './pages/FuelUtilization';
import Reports from './pages/Reports';
import DriverDetails from './pages/DriverDetails';
import AddDriver from "./pages/AddDriver";
import AddVehicle from './pages/AddVehicle';

import Header from './components/Header';
import AddEntity from './pages/AddEntity';
import EditDriver from './pages/EditDriver';
import EditEntity from './pages/EditEntity';
import EditVehicle from './pages/EditVehicle';

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ marginLeft: "250px", background: "#FAFAFA" }}> <Header /></div>
       
        <div style={{ marginLeft: "250px", padding: "50px 30px 30px 30px", background: "#FAFAFA" }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/driver-management" element={<DriverManagement />} />
          <Route path="/drivers/add" element={<AddDriver />} />
          <Route path="/drivers/edit/:id" element={<EditDriver />} />
          <Route path="/entity/edit/:id" element={<EditEntity />} />
          <Route path="/vehicle/edit/:id" element={<EditVehicle />} />
          <Route path="/vehicle-management" element={<VehicleManagement />} />
          <Route path="/vehicles/add" element={<AddVehicle />} />
          <Route path="/trip-logs" element={<TripLogs />} />
          <Route path="/entities" element={<Entities />} />
          <Route path="/entities/add" element={<AddEntity />} />
          <Route path="/driver-utilization" element={<DriverUtilization />} />
          <Route path="/fuel-utilization" element={<FuelUtilization />} />
          <Route path="/reports" element={<Reports />} />

          <Route path="/drivers/:id" element={<DriverDetails />} />

          <Route path="*" element={<Dashboard />} /> {/* Fallback */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
