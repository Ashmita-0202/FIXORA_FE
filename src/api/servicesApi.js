import axiosInstance from "./axiosInstance";

// Maps to your ServicesController
export const getAllServices = (params) =>
  axiosInstance.get("/services", { params });

export const getServiceById = (id) =>
  axiosInstance.get(`/services/${id}`);

export const getServicesByCategory = (category) =>
  axiosInstance.get("/services", { params: { category } });
