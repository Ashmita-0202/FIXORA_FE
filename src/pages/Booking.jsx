import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getServiceById } from "../api/servicesApi";
import { createBooking } from "../api/bookingsApi";
import useAuth from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import BookingTicket from "../components/booking/BookingTicket";
import Loader from "../components/common/Loader";
import "./Booking.css";

export default function Booking() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [form, setForm] = useState({ scheduledDate: "", address: "", notes: "" });
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    getServiceById(serviceId).then((res) => setService(res.data));
  }, [serviceId, user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await createBooking({
        serviceId,
        ...form,
      });
      setConfirmedBooking(data);
    } catch {
      setError("Couldn't create the booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!service) return <Loader label="Loading" />;

  if (confirmedBooking) {
    return (
      <div className="container booking-page">
        <h1>Ticket confirmed</h1>
        <p className="booking-page__sub">A technician will reach out to confirm the visit window.</p>
        <BookingTicket booking={confirmedBooking} />
        <Button onClick={() => navigate("/dashboard")}>View my bookings</Button>
      </div>
    );
  }

  return (
    <div className="container booking-page">
      <h1>Book: {service.name}</h1>
      <form onSubmit={handleSubmit} className="booking-form">
        <Input
          label="Preferred date & time"
          type="datetime-local"
          name="scheduledDate"
          value={form.scheduledDate}
          onChange={handleChange}
          required
        />
        <Input
          label="Service address"
          name="address"
          placeholder="House no., street, area"
          value={form.address}
          onChange={handleChange}
          required
        />
        <Input
          label="Notes for the technician (optional)"
          name="notes"
          placeholder="e.g. AC not cooling, makes noise"
          value={form.notes}
          onChange={handleChange}
        />
        {error && <p className="booking-form__error">{error}</p>}
        <Button type="submit" disabled={submitting} fullWidth>
          {submitting ? "Booking…" : "Confirm booking"}
        </Button>
      </form>
    </div>
  );
}
