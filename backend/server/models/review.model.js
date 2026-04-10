const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // link to User model
    rating: { type: Number, required: true },
    reviewText: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],      // users who liked
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],   // users who disliked
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);