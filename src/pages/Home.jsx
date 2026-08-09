import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllServices } from "../api/servicesApi";
import ServiceGrid from "../components/services/ServiceGrid";
import Loader from "../components/common/Loader";
import "./Home.css";

const CATEGORIES = ["AC Repair", "Washing Machine", "Refrigerator", "Microwave", "Water Purifier", "TV & Electronics"];

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllServices()
      .then((res) => setServices(res.data?.slice(0, 6) || []))
      .catch(() => setError("Couldn't load services right now."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="container hero__inner">
          <p className="hero__eyebrow">Appliance repair, ticketed and tracked</p>
          <h1 className="hero__title">Your appliance breaks.<br />We open a ticket in 60 seconds.</h1>
          <p className="hero__sub">
            Book a verified technician for AC, washing machine, fridge, or microwave repair —
            track the job from booking to job-done, just like a real service ticket.
          </p>
          <div className="hero__actions">
            <Link to="/services"><button className="btn btn--primary">Book a repair</button></Link>
          </div>
        </div>
      </section>

      <section className="container categories">
        <h2>What needs fixing?</h2>
        <div className="categories__grid">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/services?category=${encodeURIComponent(c)}`} className="category-pill">
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="container">
        <h2>Popular services</h2>
        {loading && <Loader label="Fetching services" />}
        {error && <p className="home__error">{error}</p>}
        {!loading && !error && <ServiceGrid services={services} />}
      </section>
    </div>
  );
}
