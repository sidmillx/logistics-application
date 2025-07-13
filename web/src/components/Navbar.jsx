import React from "react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css"; // Correct CSS Module import

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
              <img src="/icons/home.svg" alt="Dashboard" />
            </span>
            Dashboard
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/driver-management">
            <span className={styles.span}>
              <img src="/icons/person.svg" alt="Driver" />
            </span>
            Driver Management
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/vehicle-management">
            <span className={styles.span}>
              <img src="/icons/car.svg" alt="Vehicle" />
            </span>
            Vehicle Management
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/entities">
            <span className={styles.span}>
              <img src="/icons/map.svg" alt="Trip" />
            </span>
            Entities
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/trip-logs">
            <span className={styles.span}>
              <img src="/icons/location.svg" alt="Trip" />
            </span>
            Trip Logs
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/driver-utilization">
            <span className={styles.span}>
              <img src="/icons/assignment_driver.svg" alt="Trip" />
            </span>
            Driver Utilization
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/fuel-utilization">
            <span className={styles.span}>
              <img src="/icons/fuel.svg" alt="Trip" />
            </span>
            Fuel Utilization
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/reports">
            <span className={styles.span}>
              <img src="/icons/barchart.svg" alt="Trip" />
            </span>
            Reports
          </Link>
        </li>
        <li className={styles.li}>
          <Link to="/user-management">
            <span className={styles.span}>
              <img src="/icons/person.svg" alt="UserManagement" />
            </span>
            User Management
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;