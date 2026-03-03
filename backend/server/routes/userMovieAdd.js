const express = require("express");
const router = express.Router();
const UserMovie = require("../models/userMovieModel");

// POST /user-movie/add
router.post("/add", async (req, res) => {
  try {
    const { username, movieId } = req.body;

    if (!username || !movieId) {
      return res.status(400).json({
        error: "Missing required fields: username, movieId",
      });
    }

    const newRecord = new UserMovie({ username, movieId });
    const saved = await newRecord.save();

    return res.status(201).json(saved);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to save user-movie record",
      details: err.message,
    });
  }
});

module.exports = router;