import { useEffect, useRef, useState } from 'react';
import accountCircleIcon from '../assets/icons/account_circle.svg';
import arrowDropdownIcon from '../assets/icons/arrow_drop_down.svg';
import './Header.module.css';

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login"; // or use navigate if using useNavigate()
  };


  return (
    <div
      className="header"
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginRight: "10px",
        borderBottom: "1px solid #ccc",
        padding: "10px",
        backgroundColor: "#fff",
        position: "fixed",
        width: "calc(100% - 250px)",
        zIndex: 1000
      }}
    >
      <div
        className="person_details"
        style={{ display: "flex", alignItems: "center", position: "relative", cursor: "pointer" }}
        onClick={toggleDropdown}
        ref={dropdownRef}
      >
        <div className="header__info">
          <div className="header__role" style={{ marginRight: "10px" }}>Admin</div>
        </div>
        <img src={accountCircleIcon} alt="Profile icon" style={{ width: "30px" }} />
        <img src={arrowDropdownIcon} alt="Dropdown icon" style={{ width: "30px", marginRight: "10px" }} />

        {dropdownOpen && (
          <div
            className="dropdown"
            style={{
              position: "absolute",
              top: "45px",
              right: "15px",
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              minWidth: "150px",
              zIndex: 999
            }}
          >
            <div
              style={{
                padding: "10px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                fontSize: "14px"
              }}
              onClick={() => alert("Go to settings")}
            >
              Settings
            </div>
            <div
              style={{
                padding: "10px",
                cursor: "pointer",
                fontSize: "14px"
              }}
              onClick={handleLogout}
            >
              Logout
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
