import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import CommentSection from "../components/CommentSection";
import { FiCalendar, FiMapPin, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchEvent = useCallback(() => {
    try {
      const data = eventsAPI.getById(id);
      setEvent(data);
      setForm({
        title: data.title,
        description: data.description,
        date: data.date?.split("T")[0],
        location: data.location,
        category: data.category,
      });
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleUpdate = (e) => {
    e.preventDefault();
    try {
      const data = eventsAPI.update(id, form, user._id);
      setEvent(data);
      setEditing(false);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this event and all its comments?")) return;
    eventsAPI.delete(id, user._id);
    navigate("/");
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!event) return null;

  const isCreator = user?._id === event.creator?._id;

  return (
    <div className="event-detail-page">
      {editing ? (
        <form onSubmit={handleUpdate} className="event-form inline-form">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <div className="btn-row">
            <button type="submit" className="btn primary">Save</button>
            <button type="button" className="btn" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="event-header">
          <span className="event-category">{event.category}</span>
          <h1>{event.title}</h1>
          <p className="event-desc">{event.description}</p>
          <div className="event-meta">
            <span>
              <FiCalendar /> {new Date(event.date).toLocaleDateString()}
            </span>
            {event.location && (
              <span>
                <FiMapPin /> {event.location}
              </span>
            )}
            <span>Created by {event.creator?.username}</span>
          </div>
          {isCreator && (
            <div className="btn-row">
              <button className="btn" onClick={() => setEditing(true)}>
                <FiEdit2 /> Edit
              </button>
              <button className="btn danger" onClick={handleDelete}>
                <FiTrash2 /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      <CommentSection eventId={id} eventTitle={event.title} />
    </div>
  );
}
