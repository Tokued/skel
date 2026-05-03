const express = require("express");
const router = express.Router();
const User = require("../models/userModel");

router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      username: user.username,
      avatarUrl: user.avatarUrl,
      backgroundUrl: user.backgroundUrl,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
