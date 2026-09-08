// Central place for the backend API base URL.
//
// Override per environment by setting REACT_APP_BACKEND_SERVER_URI in
// frontend/.env (e.g. REACT_APP_BACKEND_SERVER_URI=https://api.example.com).
// Falls back to the local dev server documented in the README.
const API_BASE_URL =
  process.env.REACT_APP_BACKEND_SERVER_URI || "http://localhost:8081";

export default API_BASE_URL;
