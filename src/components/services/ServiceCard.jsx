import { Link } from "react-router-dom";
import "./ServiceCard.css";

export default function ServiceCard({ service }) {
  const { id, name, category, price, imageUrl, rating } = service;

  return (
    <Link to={`/services/${id}`} className="service-card">
      <div className="service-card__image">
        {imageUrl ? <img src={imageUrl} alt={name} /> : <div className="service-card__placeholder">{category?.[0] || "?"}</div>}
      </div>
      <div className="service-card__body">
        <p className="service-card__category">{category}</p>
        <h3 className="service-card__name">{name}</h3>
        <div className="service-card__meta">
          {rating && <span className="service-card__rating">★ {rating}</span>}
          {price && <span className="service-card__price">Rs. {price}</span>}
        </div>
      </div>
    </Link>
  );
}
