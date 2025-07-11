import Notification from '../assets/icons/nofitication.svg';
// import ProfileIcon from '../assets/icons/profile-3-woman.png';
import accountCircleIcon from '../assets/icons/account_circle.svg';
import arrowDropdownIcon from '../assets/icons/arrow_drop_down.svg';
import "./Header.module.css";

// import React, { useState, useEffect } from 'react';

const Header = () => {

// const [user, setUser] = useState({ email: '', role: '' });

//   useEffect(() => {
//     const storedUser = JSON.parse(localStorage.getItem('user'));
//     if (storedUser) setUser(storedUser);
//   }, []);

  return (
    <div className="header" style={{display: "flex", justifyContent: "flex-end", marginRight: "10px", borderBottom: "1px solid #ccc", padding: "10px", backgroundColor: "#fff", position: "fixed", width: "calc(100% - 250px)"}}>
        {/* <img src={Notification} alt="Notification icon" className='notification__icon' style={{width: "30px", marginRight: "10px"}}/> */}
        <div className="person_details" style={{display: "flex", alignItems: "center", fontSize: "14px"}}>
            <div className="header__info">
                <div className="header__role" style={{marginRight: "10px"}}>Admin</div>
            </div>
            <img src={accountCircleIcon} alt="Profile icon" className='header__icon' style={{width: "30px"}}/>
            <img src={arrowDropdownIcon} alt="Dropdown icon" className='header__icon' style={{width: "30px", marginRight: "10px"}}/>

        </div>
    </div> 
  )
}

export default Header