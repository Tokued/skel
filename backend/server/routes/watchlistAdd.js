const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

// POST /watchlist/add
router.post("/add", async (req, res) => {
  try {
    const { user, movieId, movieTitle } = req.body;

    if (!user || !movieId || !movieTitle) {
      return res.status(400).json({
        error: "Missing required fields: user, movieId, movieTitle",
      });
    }

    const newItem = new Watchlist({ user, movieId, movieTitle });
    const savedItem = await newItem.save();

    return res.status(201).json(savedItem);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to add watchlist item",
      details: err.message,
    });
  }
});

module.exports = router;