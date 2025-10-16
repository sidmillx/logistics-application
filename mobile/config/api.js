// config/api.js

const IS_DEV = false; // set to false for production

const API_BASE_URL = IS_DEV
  ? "http://localhost:5000"
  : "http://helpdesk.inyatsi.co.sz:5000";

export default API_BASE_URL;
//LAPTOP=DIE