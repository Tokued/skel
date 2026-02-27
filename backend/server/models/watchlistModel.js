const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: [true, "User is required"],
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    movieId: {
      type: String,
      required: [true, "Movie ID is required"],
      trim: true,
      minlength: 1,
      maxlength: 80
    },
    movieTitle: {
      type: String,
      required: [true, "Movie title is required"],
      trim: true,
      minlength: 1,
      maxlength: 200
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate watchlist entries for the same user + movie
watchlistSchema.index({ user: 1, movieId: 1 }, { unique: true });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

module.exports = Watchlist;