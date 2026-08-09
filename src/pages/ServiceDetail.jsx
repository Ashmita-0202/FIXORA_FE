import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getServiceById } from "../api/servicesApi";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import "./ServiceDetail.css";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getServiceById(id)
      .then((res) => setService(res.data))
      .catch(() => setError("Service not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Loading service" />;
  if (error) return <p className="container">{error}</p>;
  if (!service) return null;

  return (
    <div className="container detail">
      <div className="detail__image">
        {service.imageUrl ? <img src={service.imageUrl} alt={service.name} /> : null}
      </div>
      <div className="detail__body">
        <p className="detail__category">{service.category}</p>
        <h1>{service.name}</h1>
        <p className="detail__desc">{service.description || "Certified technician visit, diagnostics, and repair included."}</p>
        <p className="detail__price mono">Rs. {service.price}</p>
        <Button onClick={() => navigate(`/booking/${service.id}`)}>Book this service</Button>
      </div>
    </div>
  );
}
