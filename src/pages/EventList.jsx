import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { FiCalendar, FiMapPin } from "react-icons/fi";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/events")
      .then(({ data }) => setEvents(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="event-list-page">
      <h1>Event Discussions</h1>
      {events.length === 0 ? (
        <p className="empty">No events yet. Be the first to create one!</p>
      ) : (
        <div className="event-grid">
          {events.map((ev) => (
            <Link to={`/events/${ev._id}`} key={ev._id} className="event-card">
              <span className="event-category">{ev.category}</span>
              <h3>{ev.title}</h3>
              <p className="event-desc">{ev.description.slice(0, 120)}...</p>
              <div className="event-meta">
                <span>
                  <FiCalendar /> {new Date(ev.date).toLocaleDateString()}
                </span>
                {ev.location && (
                  <span>
                    <FiMapPin /> {ev.location}
                  </span>
                )}
              </div>
              <div className="event-author">By {ev.creator?.username}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
