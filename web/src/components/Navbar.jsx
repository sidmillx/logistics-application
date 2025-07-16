import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";
import { Home, User, Car, MapPin, Navigation, Users, Fuel, BarChart3, Settings } from "lucide-react";

const Navbar = () => {
  return (
    <nav className={styles.nav}>
      <div className={styles['header-container']}>
        <div className={styles['header-content']}>
          <img src="/icons/Inyatsi Logo.png" alt="Inyatsi Logo" className={styles['header-logo']} />
          {/* <h1 className={styles['header-title']}>Logistics</h1> */}
        </div>
      </div>
      <ul className={styles.ul}>
        <li className={styles.li}>
          <NavLink 
            to="/dashboard"
            className={({ isActive }) => 
              isActive ? styles.activeLink : styles.normalLink
            }
          >
            <span className={styles.span}>
              <Home className={styles.icon} />
            </span>
            <span className={styles.navText}>Dashboard</span>
          </NavLink>
        </li>
        <div className={styles.sectionNav}>
          <h3 className={styles.sectionTitle}>MANAGEMENT</h3>
          <li className={styles.li}>
            <NavLink 
              to="/driver-management"
              className={({ isActive }) => 
                isActive ? styles.activeLink : styles.normalLink
              }
            >
              <span className={styles.span}>
                <User className={styles.icon} />
              </span>
              <span className={styles.navText}>Driver Management</span>
            </NavLink>
          </li>
          <li className={styles.li}>
            <NavLink 
              to="/vehicle-management"
              className={({ isActive }) => 
                isActive ? styles.activeLink : styles.normalLink
              }
            >
              <span className={styles.span}>
                <Car className={styles.icon} />
              </span>
              <span className={styles.navText}>Vehicle Management</span>
            </NavLink>
          </li>
          <li className={styles.li}>
            <NavLink 
              to="/user-management"
              className={({ isActive }) => 
                isActive ? styles.activeLink : styles.normalLink
              }
            >
              <span className={styles.span}>
                <Settings className={styles.icon} />
              </span>
              <span className={styles.navText}>User Management</span>
            </NavLink>
          </li>
        </div>

        <div className={styles.sectionNav}>
          <h3 className={styles.sectionTitle}>OPERATIONS</h3>
          <li className={styles.li}>
            <NavLink 
              to="/entities"
              className={({ isActive }) => 
                isActive ? styles.activeLink : styles.normalLink
              }
            >
              <span className={styles.span}>
                <Navigation className={styles.icon} />
              </span>
              <span className={styles.navText}>Entities</span>
            </NavLink>
          </li>
          <li className={styles.li}>
            <NavLink 
              to="/trip-logs"
              className={({ isActive }) => 
                isActive ? styles.activeLink : styles.normalLink
              }
            >
              <span className={styles.span}>
                <MapPin className={styles.icon} />
              </span>
              <span className={styles.navText}>Trip Logs</span>
            </NavLink>
          </li>
        </div>

        <div className={styles.sectionNav}>
          <h3 className={styles.sectionTitle}>ANALYTICS</h3>
          <li className={styles.li}>
            <NavLink 
              to="/driver-utilization"
              className={({ isActive }) => 
                isActive ? styles.activeLink : styles.normalLink
              }
            >
              <span className={styles.span}>
                <Users className={styles.icon} />
              </span>
              <span className={styles.navText}>Driver Utilization</span>
            </NavLink>
          </li>
          <li className={styles.li}>
            <NavLink 
              to="/fuel-utilization"
              className={({ isActive }) => 
                isActive ? styles.activeLink : styles.normalLink
              }
            >
              <span className={styles.span}>
                <Fuel className={styles.icon} />
              </span>
              <span className={styles.navText}>Fuel Utilization</span>
            </NavLink>
          </li>
          <li className={styles.li}>
            <NavLink 
              to="/reports"
              className={({ isActive }) => 
                isActive ? styles.activeLink : styles.normalLink
              }
            >
              <span className={styles.span}>
                <BarChart3 className={styles.icon} />
              </span>
              <span className={styles.navText}>Reports</span>
            </NavLink>
          </li>
        </div>
      </ul>

      <div className={styles['values-container']}>
        <div className={styles['values-content']}>
          <img src="/icons/Core Values.png" alt="Core Values" className={styles['values-image']} />
          <p className={styles['values-text']}>Our Core Values</p>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;