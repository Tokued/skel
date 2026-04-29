const express = require("express");
const router = express.Router();
const axios = require("axios"); // 👈 ADDED

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
// 👤 GET ALL USERS
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
// 📝 GET USER REVIEWS (FIXED ✅)
// ------------------------
router.get("/users/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.id });

    const updatedReviews = await Promise.all(
      reviews.map(async (r) => {
        let movieTitle = "Unknown Movie";

        if (r.movieId) {
          try {
            const movieRes = await axios.get("http://www.omdbapi.com/", {
              params: {
                apikey: process.env.OMDB_API_KEY,
                i: r.movieId,
              },
            });

            movieTitle = movieRes.data?.Title || "Unknown Movie";
          } catch (err) {
            console.log("OMDB error:", err.message);
          }
        }

        return {
          ...r.toObject(),
          movieTitle, // 👈 FRONTEND USES THIS
        };
      })
    );

    res.json(updatedReviews);
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
// 🚨 FLAGGED REVIEW QUEUE
// ------------------------
router.get("/reviews/flagged", async (req, res) => {
  try {
    const flaggedReviews = await Review.find({ flagged: true }).populate(
      "userId",
      "username"
    );
    res.json(flaggedReviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------
// ✅ UNFLAG REVIEW
// ------------------------
router.put("/reviews/:id/unflag", async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { flagged: false });
    res.json({ message: "Review unflagged" });
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
// ✅ UNWARN USER
// ------------------------
router.put("/users/:id/unwarn", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { warned: false });
    res.json({ message: "User warning removed" });
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

// ------------------------
// ✅ UNBAN USER
// ------------------------
router.put("/users/:id/unban", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBanned: false });
    res.json({ message: "User unbanned" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;