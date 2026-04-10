const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

router.put("/favorite/:userId/:movieId", async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      userId: req.params.userId,
      movieId: req.params.movieId,
    });

    if (!item) return res.status(404).json({ message: "Not found" });
    if (!item.watched)
      return res.status(400).json({ message: "Watch movie first" });

    item.favorite = req.body.favorite;

    await item.save();
    res.json(item);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;