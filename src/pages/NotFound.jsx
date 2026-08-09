import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
      <h1>404 — Ticket not found</h1>
      <p style={{ margin: "1rem 0", color: "var(--color-ink-soft)" }}>
        This page doesn't exist in our job log.
      </p>
      <Link to="/"><button className="btn btn--primary">Back to home</button></Link>
    </div>
  );
}
