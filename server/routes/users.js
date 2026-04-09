import { Router } from "express";
import User from "../models/User.js";

const router = Router();

// GET /api/users/search?q=term  – search users for tagging
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);

    const users = await User.find({
      username: { $regex: q, $options: "i" },
    })
      .select("username email")
      .limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
