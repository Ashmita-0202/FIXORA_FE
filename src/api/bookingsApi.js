import axiosInstance from "./axiosInstance";

// Maps to your BookingsController
export const createBooking = (bookingData) =>
  axiosInstance.post("/bookings", bookingData);

export const getMyBookings = () =>
  axiosInstance.get("/bookings/my");

export const getBookingById = (id) =>
  axiosInstance.get(`/bookings/${id}`);

export const cancelBooking = (id) =>
  axiosInstance.patch(`/bookings/${id}/cancel`);
