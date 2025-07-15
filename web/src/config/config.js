const environment = "production";

const API_BASE_URL =
  environment === 'production'
    ? 'https://logistics-application.onrender.com' 
    : 'http://localhost:5000';

export default API_BASE_URL;
