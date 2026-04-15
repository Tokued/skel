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
    },
    favorite: {
        type: Boolean,
        default: false
    },
    watched: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    watchedAt: {
        type: Date,
        default: null
    }
});

// prevents duplicate movies per user
watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model("Watchlist", watchlistSchema);
