const express = require("express");
const router = express.Router();
const Watchlist = require("../models/watchlistModel");

router.get("/watchlist/:userId", async (req, res) => {
    try {

        const { userId } = req.params;

        const watchlist = await Watchlist.find({ userId })
                                         .sort({ addedAt: -1 });

        res.json(watchlist);

    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
});

module.exports = router;