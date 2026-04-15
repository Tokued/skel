const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

// ✅ NOW includes /watched in the route
router.put("/watched/:userId/:movieId", async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      userId: req.params.userId,
      movieId: req.params.movieId,
    });

    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    item.watched = req.body.watched;

    if (req.body.watched) {
      item.watchedAt = new Date();
    } else {
      // reset if unwatching
      item.rating = null;
      item.favorite = false;
      item.watchedAt = null;
    }

    await item.save();
    res.json(item);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;