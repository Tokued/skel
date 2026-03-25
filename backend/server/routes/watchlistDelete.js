const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

router.delete("/:userId/:movieId", async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    const result = await Watchlist.deleteOne({ userId, movieId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Movie not found in watchlist" });
    }

    res.status(200).json({ message: "Movie removed from watchlist" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;