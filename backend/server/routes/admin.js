const express = require("express");
const router = express.Router();

const User = require("../models/userModel");
const Review = require("../models/review.model");
// ------------------------
// 📊 ADMIN STATS
// ------------------------
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    const flaggedReviews = await Review.countDocuments({ flagged: true });

    res.json({
      totalUsers,
      totalReviews,
      flaggedReviews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------
// 👤 GET ALL USERS (with optional search)
// ------------------------
router.get("/users", async (req, res) => {
  try {
    const search = req.query.search || "";

    const users = await User.find({
      username: { $regex: search, $options: "i" },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------
// 📝 GET USER REVIEWS
// ------------------------
router.get("/users/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.id });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------
// ❌ DELETE REVIEW
// ------------------------
router.delete("/reviews/:id", async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------
// 🚩 FLAG REVIEW
// ------------------------
router.put("/reviews/:id/flag", async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { flagged: true });
    res.json({ message: "Review flagged" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------
// ⚠️ WARN USER
// ------------------------
router.put("/users/:id/warn", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { warned: true });
    res.json({ message: "User warned" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------
// 🔨 BAN USER
// ------------------------
router.put("/users/:id/ban", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBanned: true });
    res.json({ message: "User banned" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;