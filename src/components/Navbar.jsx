import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { FiBell, FiLogOut, FiPlus } from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        EventHub
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <Link to="/events/create" className="nav-btn" title="Create Event">
              <FiPlus /> New Event
            </Link>
            <NotifBell />
            <span className="nav-user">Hi, {user.username}</span>
            <button onClick={handleLogout} className="nav-btn logout-btn" title="Logout">
              <FiLogOut />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn">Login</Link>
            <Link to="/register" className="nav-btn primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function NotifBell() {
  const { unreadCount } = useNotifications();
  return (
    <Link to="/notifications" className="nav-btn notif-btn" title="Notifications">
      <FiBell />
      {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
    </Link>
  );
}
