import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          Fix<span>ora</span>
        </Link>

        <nav className="navbar__links">
          <Link to="/services">Services</Link>
          {user && <Link to="/dashboard">My Bookings</Link>}
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              <span className="navbar__user">Hi, {user.name?.split(" ")[0]}</span>
              <button className="navbar__logout" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__login">Log in</Link>
              <Link to="/signup" className="navbar__cta">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
