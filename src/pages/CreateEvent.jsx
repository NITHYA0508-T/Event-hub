import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    category: "General",
  });
  const [error, setError] = useState("");

  const categories = ["General", "Tech", "Sports", "Music", "Education", "Social", "Other"];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = eventsAPI.create(form, user._id);
      navigate(`/events/${data._id}`);
    } catch (err) {
      setError(err.message || "Failed to create event");
    }
  };

  return (
    <div className="form-page">
      <form onSubmit={handleSubmit} className="event-form">
        <h2>Create Event</h2>
        {error && <div className="error-msg">{error}</div>}
        <input
          type="text"
          placeholder="Event Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
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
          placeholder="Location (optional)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="btn primary">Create Event</button>
      </form>
    </div>
  );
}
