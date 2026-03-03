const express = require("express");
const router = express.Router();
const UserMovie = require("../models/userMovieModel");

// GET /user-movie/getAll
router.get("/getAll", async (req, res) => {
  try {
    const records = await UserMovie.find().sort({ createdAt: -1 });
    return res.status(200).json(records);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch user-movie records",
      details: err.message,
    });
  }
});

module.exports = router;