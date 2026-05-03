const express = require("express");
const router = express.Router();
const User = require("../models/userModel");

router.put("/profile/update", async (req, res) => {
  try {
    const { userId, avatarUrl, backgroundUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { avatarUrl, backgroundUrl },
      { new: true }
    );

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
