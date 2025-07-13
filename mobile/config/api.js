// config/api.js

const IS_DEV = true; // set to false for production

const API_BASE_URL = IS_DEV
  ? "http://localhost:5000"
  : "https://logistics-application.onrender.com";

export default API_BASE_URL;
