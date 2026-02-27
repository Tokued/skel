const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

// GET /watchlist/getAll
router.get("/getAll", async (req, res) => {
  try {
    const items = await Watchlist.find();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch watchlist items",
      details: err.message,
    });
  }
});

module.exports = router;