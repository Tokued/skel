const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

router.post("/watchlist/add", async (req, res) => {
    try {

        const { userId, movieId, title } = req.body;

        if (!userId || !movieId || !title) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const exists = await Watchlist.findOne({ userId, movieId });

        if (exists) {
            return res.status(409).json({
                message: "Movie already in watchlist"
            });
        }

        const newItem = new Watchlist({
            userId,
            movieId,
            title
        });

        await newItem.save();

        res.status(201).json({
            message: "Movie added to watchlist",
            data: newItem
        });

    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
});

module.exports = router;