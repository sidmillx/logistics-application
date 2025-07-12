import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Redirect to login if no user or not an admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
