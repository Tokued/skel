const express = require("express");
const router = express.Router();
const Watchlist = require("../models/Watchlist");


// ✅ Get user watchlist
router.get("/:userId", async (req, res) => {
  try {
    const items = await Watchlist.find({ userId: req.params.userId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Add movie to watchlist
router.post("/", async (req, res) => {
  try {
    const { userId, movieId, title } = req.body;

    const newItem = new Watchlist({
      userId,
      movieId,
      title,
    });

    await newItem.save();
    res.status(201).json(newItem);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Movie already in watchlist" });
    }
    res.status(500).json({ error: err.message });
  }
});


// ✅ Toggle watched
router.put("/:userId/:movieId", async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      userId: req.params.userId,
      movieId: req.params.movieId,
    });

    if (!item) return res.status(404).json({ message: "Not found" });

    item.watched = req.body.watched;

    // reset if unwatching
    if (!item.watched) {
      item.rating = null;
      item.favorite = false;
    }

    await item.save();
    res.json(item);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ⭐ Set rating
router.put("/:userId/:movieId/rating", async (req, res) => {
  try {
    const item = await Watchlist.findOne({
      userId: req.params.userId,
      movieId: req.params.movieId,
    });

    if (!item) return res.status(404).json({ message: "Not found" });
    if (!item.watched)
      return res.status(400).json({ message: "Watch movie first" });

    item.rating = req.body.rating;

    await item.save();
    res.json(item);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ❤️ Toggle favorite
router.put("/:userId/:movieId/favorite", async (req, res) => {
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


// ❌ Remove movie
router.delete("/:userId/:movieId", async (req, res) => {
  try {
    await Watchlist.findOneAndDelete({
      userId: req.params.userId,
      movieId: req.params.movieId,
    });

    res.json({ message: "Removed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;