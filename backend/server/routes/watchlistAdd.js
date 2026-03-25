const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

router.post("/add", async (req, res) => {
    try {
        const { userId, movieId, title } = req.body;

        if (!userId || !movieId || !title) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newItem = new Watchlist({ userId, movieId, title });
        await newItem.save();
        res.status(201).json({ message: "Movie added to watchlist", data: newItem });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Movie already exists in watchlist" });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;