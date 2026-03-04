const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    userId: { type: String, required: true },
    rating: { type: Number, required: true },
    reviewText: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);