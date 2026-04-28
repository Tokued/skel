const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // link to User model
    rating: { type: Number, required: true },
    reviewText: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],      // users who liked
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],   // users who disliked

    // ✅ ADD THIS (for admin dashboard)
    flagged: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);