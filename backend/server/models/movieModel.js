const mongoose = require("mongoose");

//movie schema/model
const newMovieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      label: "title",
    },
    description: {
      type: String,
      required: true,
      label: "description",
    },
    director: {
      required: true,
      type: String,
      label: "director",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
        label: "rating"
    },
    poster: {
        type: String,
        label: "poster"
    },
  },
  { collection: "movies" }
);

module.exports = mongoose.model('movies', newMovieSchema)