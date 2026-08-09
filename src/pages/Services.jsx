import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllServices } from "../api/servicesApi";
import ServiceGrid from "../components/services/ServiceGrid";
import Loader from "../components/common/Loader";
import "./Services.css";

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getAllServices(category ? { category } : {})
      .then((res) => setServices(res.data || []))
      .catch(() => setError("Couldn't load services right now."))
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = services.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container services-page">
      <h1>All services</h1>

      <div className="services-page__toolbar">
        <input
          className="services-page__search"
          placeholder="Search services…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {category && (
          <button className="services-page__clear" onClick={() => setSearchParams({})}>
            Category: {category} ✕
          </button>
        )}
      </div>

      {loading && <Loader label="Fetching services" />}
      {error && <p className="services-page__error">{error}</p>}
      {!loading && !error && <ServiceGrid services={filtered} />}
    </div>
  );
}
