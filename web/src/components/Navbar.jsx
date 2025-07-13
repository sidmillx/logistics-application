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
import styles from "/Navbar.module.css"; // Correct CSS Module import

const Navbar = () => {
  return (
    <nav className={styles.nav}>
      <div className={styles.logoName}>
        <h1>Logistics</h1>
      </div>
      <ul className={styles.ul}>
        <li className={styles.li}>
          <Link to="/dashboard">
            <span className={styles.span}>
              <img src={homeIcon} alt="Dashboard" />
            </span>
            Dashboard
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/driver-management">
            <span className={styles.span}>
              <img src={personIcon} alt="Driver" />
            </span>
            Driver Management
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/vehicle-management">
            <span className={styles.span}>
              <img src={carIcon} alt="Vehicle" />
            </span>
            Vehicle Management
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/entities">
            <span className={styles.span}>
              <img src={mapIcon} alt="Trip" />
            </span>
            Entities
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/trip-logs">
            <span className={styles.span}>
              <img src={locationIcon} alt="Trip" />
            </span>
            Trip Logs
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/driver-utilization">
            <span className={styles.span}>
              <img src={driverAssignmentIcon} alt="Trip" />
            </span>
            Driver Utilization
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/fuel-utilization">
            <span className={styles.span}>
              <img src={fuelIcon} alt="Trip" />
            </span>
            Fuel Utilization
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/reports">
            <span className={styles.span}>
              <img src={barchartIcon} alt="Trip" />
            </span>
            Reports
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/user-management">
            <span className={styles.span}>
              <img src={personIcon} alt="UserManagement" />
            </span>
            User Management
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;