import axios from "axios";

// Set REACT_APP_API_BASE_URL in your .env file.
// e.g. REACT_APP_API_BASE_URL=https://localhost:7031/api  (dev, ASP.NET Core default)
//      REACT_APP_API_BASE_URL=https://api.fixora.com/api  (deployed)
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT to every request if present
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("fixora_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired/invalid tokens globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("fixora_token");
      localStorage.removeItem("fixora_user");
      // Let the app redirect via AuthContext / ProtectedRoute rather than
      // forcing a hard reload here.
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
