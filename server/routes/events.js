import { Router } from "express";
import auth from "../middleware/auth.js";
import Event from "../models/Event.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const router = Router();

// GET /api/events  – list all events
router.get("/", async (_req, res) => {
  try {
    const events = await Event.find()
      .populate("creator", "username email")
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/:id  – single event
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "creator",
      "username email"
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events  – create event (protected)
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;

    if (!title || !description || !date) {
      return res
        .status(400)
        .json({ message: "Title, description, and date are required" });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      category,
      creator: req.userId,
    });

    const populated = await event.populate("creator", "username email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/events/:id/update  – update event (protected, creator only)
router.put("/:id/update", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.creator.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorised" });
    }

    const { title, description, date, location, category } = req.body;
    Object.assign(event, {
      ...(title && { title }),
      ...(description && { description }),
      ...(date && { date }),
      ...(location !== undefined && { location }),
      ...(category && { category }),
    });

    await event.save();

    // Notify commenters about event update
    const commenters = await Comment.find({ event: event._id }).distinct("author");
    const notifications = commenters
      .filter((id) => id.toString() !== req.userId)
      .map((recipient) => ({
        recipient,
        sender: req.userId,
        type: "event_update",
        event: event._id,
        message: `Event "${event.title}" has been updated`,
      }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
    }

    const populated = await event.populate("creator", "username email");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/events/:id  – delete event (protected, creator only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.creator.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorised" });
    }

    await Comment.deleteMany({ event: event._id });
    await Notification.deleteMany({ event: event._id });
    await event.deleteOne();

    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Comments ──────────────────────────────────────────

// GET /api/events/:id/comments
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ event: req.params.id })
      .populate("author", "username email")
      .populate("taggedUsers", "username")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events/:id/comment  – add comment (protected)
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text, parentComment, taggedUsernames } = req.body;

    if (!text) return res.status(400).json({ message: "Text is required" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Resolve tagged usernames to IDs
    let taggedUsers = [];
    if (taggedUsernames?.length) {
      const users = await User.find({ username: { $in: taggedUsernames } });
      taggedUsers = users.map((u) => u._id);
    }

    const comment = await Comment.create({
      text,
      author: req.userId,
      event: req.params.id,
      parentComment: parentComment || null,
      taggedUsers,
    });

    // Notifications for tagged users
    const tagNotifs = taggedUsers
      .filter((id) => id.toString() !== req.userId)
      .map((recipient) => ({
        recipient,
        sender: req.userId,
        type: "tag",
        event: event._id,
        comment: comment._id,
        message: `You were tagged in a comment on "${event.title}"`,
      }));

    // Notification for event creator (new comment)
    const notifs = [...tagNotifs];
    if (event.creator.toString() !== req.userId) {
      notifs.push({
        recipient: event.creator,
        sender: req.userId,
        type: "comment",
        event: event._id,
        comment: comment._id,
        message: `New comment on your event "${event.title}"`,
      });
    }

    // If this is a reply, notify the parent comment author
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent && parent.author.toString() !== req.userId) {
        notifs.push({
          recipient: parent.author,
          sender: req.userId,
          type: "reply",
          event: event._id,
          comment: comment._id,
          message: `Someone replied to your comment on "${event.title}"`,
        });
      }
    }

    if (notifs.length) {
      await Notification.insertMany(notifs);
    }

    const populated = await comment.populate([
      { path: "author", select: "username email" },
      { path: "taggedUsers", select: "username" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
