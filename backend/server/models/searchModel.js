const mongoose = require("mongoose");

const searchSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      // optional: "movies" or "reviews"
      type: String,
      trim: true,
      default: "movies",
    },
  },
  { timestamps: true }
);

const Search = mongoose.model("Search", searchSchema);
module.exports = Search;