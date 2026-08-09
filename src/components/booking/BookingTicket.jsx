import "./BookingTicket.css";

/**
 * Signature element: every confirmed booking renders as a physical
 * "job ticket" — the same stub a repair technician would hand a customer.
 * Ticket number is real (booking.id), status is a stamped rotation.
 */
export default function BookingTicket({ booking }) {
  const { id, serviceName, scheduledDate, technicianName, status, price } = booking;

  return (
    <div className="ticket">
      <div className="ticket__top">
        <div>
          <p className="ticket__eyebrow">Fixora job ticket</p>
          <h3 className="ticket__service">{serviceName}</h3>
        </div>
        <span className={`ticket__stamp ticket__stamp--${status?.toLowerCase()}`}>{status}</span>
      </div>

      <div className="ticket__divider" aria-hidden="true" />

      <dl className="ticket__rows">
        <div className="ticket__row">
          <dt>Ticket no.</dt>
          <dd className="mono">#{String(id).padStart(6, "0")}</dd>
        </div>
        <div className="ticket__row">
          <dt>Scheduled</dt>
          <dd>{scheduledDate ? new Date(scheduledDate).toLocaleString() : "Pending"}</dd>
        </div>
        <div className="ticket__row">
          <dt>Technician</dt>
          <dd>{technicianName || "To be assigned"}</dd>
        </div>
        <div className="ticket__row">
          <dt>Amount</dt>
          <dd className="mono">Rs. {price}</dd>
        </div>
      </dl>
    </div>
  );
}
