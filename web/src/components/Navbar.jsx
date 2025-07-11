import React from "react";
import { Link } from "react-router-dom";
import homeIcon from "../assets/icons/home.svg";
import personIcon from "../assets/icons/person.svg";
import carIcon from "../assets/icons/car.svg";
import fuelIcon from "../assets/icons/fuel.svg";
import locationIcon from "../assets/icons/location.svg";
import barchartIcon from "../assets/icons/barchart.svg";
import mapIcon from "../assets/icons/map.svg";
import driverAssignmentIcon from "../assets/icons/assignment_driver.svg";
import "./Navbar.module.css";


const Navbar = () => {
  return (
    <nav>
      <div className="logo-name" style={{color: "#fff", textAlign: "center"}}><h1>Logistics</h1></div>
      <ul>
        <li>
          <Link to="/dashboard">
            <span><img src={homeIcon} alt="Dashboard" /></span>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/driver-management">
            <span><img src={personIcon} alt="Driver" /></span>
            Driver Management
          </Link>
        </li>
        <li>
          <Link to="/vehicle-management">
            <span><img src={carIcon} alt="Vehicle" /></span>
            Vehicle Management
          </Link>
        </li>
        
        <li>
          <Link to="/entities">
            <span><img src={mapIcon} alt="Trip" /></span>
            Entities
          </Link>
        </li>
        <li>
          <Link to="/trip-logs">
            <span><img src={locationIcon} alt="Trip" /></span>
            Trip Logs
          </Link>
        </li>
        <li>
          <Link to="/driver-utilization">
            <span><img src={driverAssignmentIcon} alt="Trip" /></span>
            Driver Utilization
          </Link>
        </li>
        <li>
          <Link to="/fuel-utilization">
            <span><img src={fuelIcon} alt="Trip" /></span>
            Fuel Utilization
          </Link>
        </li>
        <li>
          <Link to="/reports">
            <span><img src={barchartIcon} alt="Trip" /></span>
            Reports
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
