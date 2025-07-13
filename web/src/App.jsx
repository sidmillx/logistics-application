import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Header from './components/Header';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
import AddEntity from './pages/AddEntity';
import EditDriver from './pages/EditDriver';
import EditEntity from './pages/EditEntity';
import EditVehicle from './pages/EditVehicle';
import ViewFuelLogs from './pages/ViewFuelLogs';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import PrivateRoute from './utils/PrivateRoutes';

const Layout = ({ children }) => {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  if (isLogin) return children;

  return (
    <>
      <Navbar />
      <div style={{ marginLeft: "250px", background: "#FAFAFA" }}><Header /></div>
      <div style={{ marginLeft: "250px", padding: "50px 30px 30px 30px", background: "#FAFAFA" }}>
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/driver-management" element={
            <PrivateRoute><DriverManagement /></PrivateRoute>
          } />
          <Route path="/drivers/add" element={
            <PrivateRoute><AddDriver /></PrivateRoute>
          } />
          <Route path="/drivers/edit/:id" element={
            <PrivateRoute><EditDriver /></PrivateRoute>
          } />
          <Route path="/drivers/:id" element={
            <PrivateRoute><DriverDetails /></PrivateRoute>
          } />
          <Route path="/entities" element={
            <PrivateRoute><Entities /></PrivateRoute>
          } />
          <Route path="/entities/add" element={
            <PrivateRoute><AddEntity /></PrivateRoute>
          } />
          <Route path="/entity/edit/:id" element={
            <PrivateRoute><EditEntity /></PrivateRoute>
          } />
          <Route path="/vehicle-management" element={
            <PrivateRoute><VehicleManagement /></PrivateRoute>
          } />
          <Route path="/vehicles/add" element={
            <PrivateRoute><AddVehicle /></PrivateRoute>
          } />
          <Route path="/vehicle/edit/:id" element={
            <PrivateRoute><EditVehicle /></PrivateRoute>
          } />
          <Route path="/vehicles/:id/fuel" element={
            <PrivateRoute><ViewFuelLogs /></PrivateRoute>
          } />
          <Route path="/trip-logs" element={
            <PrivateRoute><TripLogs /></PrivateRoute>
          } />
          <Route path="/driver-utilization" element={
            <PrivateRoute><DriverUtilization /></PrivateRoute>
          } />
          <Route path="/fuel-utilization" element={
            <PrivateRoute><FuelUtilization /></PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute><Reports /></PrivateRoute>
          } />
          <Route path="/user-management" element={
            <PrivateRoute><UserManagement /></PrivateRoute>
          } />
          
          {/* Redirect all other paths to dashboard */}

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </Router>
  );
}

export default App;
