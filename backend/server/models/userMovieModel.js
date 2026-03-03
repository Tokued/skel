const mongoose = require("mongoose");

const userMovieSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    movieId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const UserMovie = mongoose.model("UserMovie", userMovieSchema);
module.exports = UserMovie;