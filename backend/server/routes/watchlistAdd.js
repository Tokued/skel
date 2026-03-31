const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

router.post("/add", async (req, res) => {
  console.log("POST /watchlist/add hit");
  console.log("Request body:", req.body);

  try {
    const { userId, movieId, title } = req.body;

    if (!userId || !movieId || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newItem = new Watchlist({ userId, movieId, title });
    await newItem.save();

    return res.status(201).json({
      message: "Movie added to watchlist",
      data: newItem,
    });
  } catch (error) {
    console.error("Watchlist add error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Movie already exists in watchlist",
      });
    }

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;