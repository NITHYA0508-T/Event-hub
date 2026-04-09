import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiCheckCircle } from "react-icons/fi";

export default function Notifications() {
  const { notifications, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (notif) => {
    if (!notif.read) await markRead(notif._id);
    if (notif.event?._id) navigate(`/events/${notif.event._id}`);
  };

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <h1>Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button className="btn" onClick={markAllRead}>
            <FiCheckCircle /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="empty">No notifications yet.</p>
      ) : (
        <ul className="notif-list">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={`notif-item ${n.read ? "" : "unread"}`}
              onClick={() => handleClick(n)}
            >
              <div className="notif-content">
                <strong>{n.sender?.username}</strong> — {n.message}
                <div className="notif-time">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {!n.read && (
                <button
                  className="notif-read-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead(n._id);
                  }}
                  title="Mark as read"
                >
                  <FiCheck />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
