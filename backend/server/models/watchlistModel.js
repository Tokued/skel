const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    movieId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// prevents duplicate movies per user
watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model("Watchlist", watchlistSchema);
