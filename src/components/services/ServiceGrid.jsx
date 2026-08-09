import ServiceCard from "./ServiceCard";
import "./ServiceGrid.css";

export default function ServiceGrid({ services }) {
  if (!services?.length) {
    return <p className="service-grid__empty">No services found. Try a different search.</p>;
  }
  return (
    <div className="service-grid">
      {services.map((s) => <ServiceCard key={s.id} service={s} />)}
    </div>
  );
}
