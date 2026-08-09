import { useState, useEffect } from "react";
import { getMyBookings } from "../api/bookingsApi";
import BookingTicket from "../components/booking/BookingTicket";
import Loader from "../components/common/Loader";
import "./Dashboard.css";

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyBookings()
      .then((res) => setBookings(res.data || []))
      .catch(() => setError("Couldn't load your bookings."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container dashboard">
      <h1>My bookings</h1>
      {loading && <Loader label="Fetching your tickets" />}
      {error && <p className="dashboard__error">{error}</p>}
      {!loading && !error && bookings.length === 0 && (
        <p className="dashboard__empty">No bookings yet — go book a repair.</p>
      )}
      <div className="dashboard__grid">
        {bookings.map((b) => <BookingTicket key={b.id} booking={b} />)}
      </div>
    </div>
  );
}
