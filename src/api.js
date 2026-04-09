// ─── Local Database (localStorage-based, no backend needed) ──────────────────

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const db = {
  get: (key) => JSON.parse(localStorage.getItem(key) || "[]"),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (username, email, password) => {
    const users = db.get("users");
    if (users.find((u) => u.email === email))
      throw new Error("Email already registered");
    if (users.find((u) => u.username === username))
      throw new Error("Username already taken");
    const user = { _id: genId(), username, email, password, createdAt: new Date().toISOString() };
    db.set("users", [...users, user]);
    const token = btoa(JSON.stringify({ id: user._id, username: user.username }));
    return { token, user: { _id: user._id, username: user.username, email: user.email } };
  },

  login: (email, password) => {
    const users = db.get("users");
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid email or password");
    const token = btoa(JSON.stringify({ id: user._id, username: user.username }));
    return { token, user: { _id: user._id, username: user.username, email: user.email } };
  },
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: () => {
    const events = db.get("events");
    const users = db.get("users");
    return events
      .map((ev) => ({ ...ev, creator: users.find((u) => u._id === ev.creatorId) || { username: "Unknown" } }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById: (id) => {
    const events = db.get("events");
    const users = db.get("users");
    const ev = events.find((e) => e._id === id);
    if (!ev) throw new Error("Event not found");
    return { ...ev, creator: users.find((u) => u._id === ev.creatorId) || { username: "Unknown" } };
  },

  create: (data, userId) => {
    const events = db.get("events");
    const users = db.get("users");
    const ev = { _id: genId(), ...data, creatorId: userId, createdAt: new Date().toISOString() };
    db.set("events", [...events, ev]);
    return { ...ev, creator: users.find((u) => u._id === userId) || { username: "Unknown" } };
  },

  update: (id, data, userId) => {
    const events = db.get("events");
    const users = db.get("users");
    const idx = events.findIndex((e) => e._id === id);
    if (idx === -1) throw new Error("Event not found");
    if (events[idx].creatorId !== userId) throw new Error("Not authorized");
    events[idx] = { ...events[idx], ...data };
    db.set("events", events);
    return { ...events[idx], creator: users.find((u) => u._id === userId) || { username: "Unknown" } };
  },

  delete: (id, userId) => {
    const events = db.get("events");
    const ev = events.find((e) => e._id === id);
    if (!ev) throw new Error("Event not found");
    if (ev.creatorId !== userId) throw new Error("Not authorized");
    db.set("events", events.filter((e) => e._id !== id));
    // also delete comments for this event
    const comments = db.get("comments");
    db.set("comments", comments.filter((c) => c.eventId !== id));
  },
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentsAPI = {
  getByEvent: (eventId) => {
    const comments = db.get("comments");
    const users = db.get("users");
    return comments
      .filter((c) => c.eventId === eventId)
      .map((c) => ({ ...c, author: users.find((u) => u._id === c.authorId) || { username: "Unknown" } }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  add: (eventId, text, parentComment, taggedUsernames, userId) => {
    const comments = db.get("comments");
    const users = db.get("users");
    const taggedUsers = taggedUsernames
      .map((name) => users.find((u) => u.username === name))
      .filter(Boolean)
      .map((u) => ({ _id: u._id, username: u.username }));

    const comment = {
      _id: genId(),
      eventId,
      text,
      parentComment: parentComment || null,
      taggedUsers,
      authorId: userId,
      createdAt: new Date().toISOString(),
    };
    db.set("comments", [...comments, comment]);

    // Create notifications for tagged users
    const notifications = db.get("notifications");
    taggedUsers.forEach((tagged) => {
      if (tagged._id !== userId) {
        notifications.push({
          _id: genId(),
          userId: tagged._id,
          message: `You were mentioned in a comment`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    });
    db.set("notifications", notifications);

    return { ...comment, author: users.find((u) => u._id === userId) || { username: "Unknown" } };
  },

  searchUsers: (query) => {
    const users = db.get("users");
    return users
      .filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((u) => ({ _id: u._id, username: u.username }));
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getForUser: (userId) => {
    const notifications = db.get("notifications");
    return notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  markRead: (id) => {
    const notifications = db.get("notifications");
    db.set("notifications", notifications.map((n) => n._id === id ? { ...n, read: true } : n));
  },

  markAllRead: (userId) => {
    const notifications = db.get("notifications");
    db.set("notifications", notifications.map((n) => n.userId === userId ? { ...n, read: true } : n));
  },
};
