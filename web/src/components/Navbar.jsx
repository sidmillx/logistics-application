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

const Navbar = () => {
  const navStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: "250px",
    backgroundColor: "#00204D",
    paddingTop: "20px",
    boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Poppins', sans-serif",
  };

  const logoNameStyle = {
    color: "#fff",
    textAlign: "center",
    marginBottom: "20px",
  };

  const ulStyle = {
    listStyle: "none",
    padding: 0,
    margin: 0,
  };

  const liStyle = {
    margin: "10px 0",
  };

  const linkStyle = {
    display: "flex",
    alignItems: "center",
    color: "white",
    textDecoration: "none",
    padding: "10px 20px",
    transition: "background 0.2s",
  };

  const hoverStyle = {
    backgroundColor: "#2e2e42",
  };

  const spanStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
  };

  const imgStyle = {
    filter: "brightness(0) invert(1)",
    width: "20px",
    height: "20px",
  };

  return (
    <nav style={navStyle}>
      <div style={logoNameStyle}>
        <h1>Logistics</h1>
      </div>
      <ul style={ulStyle}>
        <li style={liStyle}>
          <Link
            to="/dashboard"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={homeIcon} alt="Dashboard" style={imgStyle} />
            </span>
            Dashboard
          </Link>
        </li>
        <li style={liStyle}>
          <Link
            to="/driver-management"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={personIcon} alt="Driver" style={imgStyle} />
            </span>
            Driver Management
          </Link>
        </li>
        <li style={liStyle}>
          <Link
            to="/vehicle-management"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={carIcon} alt="Vehicle" style={imgStyle} />
            </span>
            Vehicle Management
          </Link>
        </li>
        <li style={liStyle}>
          <Link
            to="/entities"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={mapIcon} alt="Trip" style={imgStyle} />
            </span>
            Entities
          </Link>
        </li>
        <li style={liStyle}>
          <Link
            to="/trip-logs"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={locationIcon} alt="Trip" style={imgStyle} />
            </span>
            Trip Logs
          </Link>
        </li>
        <li style={liStyle}>
          <Link
            to="/driver-utilization"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={driverAssignmentIcon} alt="Trip" style={imgStyle} />
            </span>
            Driver Utilization
          </Link>
        </li>
        <li style={liStyle}>
          <Link
            to="/fuel-utilization"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={fuelIcon} alt="Trip" style={imgStyle} />
            </span>
            Fuel Utilization
          </Link>
        </li>
        <li style={liStyle}>
          <Link
            to="/reports"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={barchartIcon} alt="Trip" style={imgStyle} />
            </span>
            Reports
          </Link>
        </li>
        <li style={liStyle}>
          <Link
            to="/user-management"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = hoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "")}
          >
            <span style={spanStyle}>
              <img src={personIcon} alt="UserManagement" style={imgStyle} />
            </span>
            User Management
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;