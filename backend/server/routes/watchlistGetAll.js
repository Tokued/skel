const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

router.get("/:userId", async (req, res) => {
    try {
        const watchlist = await Watchlist.find({ userId: req.params.userId });
        res.status(200).json(watchlist);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;