import axiosInstance from "./axiosInstance";

// Maps to your AuthController — adjust endpoint paths to match your
// actual controller routes if they differ.
export const login = (credentials) =>
  axiosInstance.post("/auth/login", credentials);

export const signup = (userData) =>
  axiosInstance.post("/User/AddUser", userData);

export const getCurrentUser = () =>
  axiosInstance.get("/auth/me");
