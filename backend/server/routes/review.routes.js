const express = require("express");
const router = express.Router();
const Review = require("../models/review.model");

// Add a review (one per user per movie)
router.post("/add", async (req, res) => {
    try {
        const { movieId, userId, rating, reviewText } = req.body;

        // Check if user already reviewed this movie
        const existing = await Review.findOne({ movieId, userId });
        if (existing)
            return res.status(400).json({ message: "You already reviewed this movie!" });

        const newReview = new Review({ movieId, userId, rating, reviewText });
        const savedReview = await newReview.save();
        res.status(201).json({ message: "Review added successfully", review: savedReview });
    } catch (err) {
        res.status(500).json({ message: "Error adding review", error: err.message });
    }
});

// Get all reviews (with usernames populated)
router.get("/all", async (req, res) => {
    try {
        const reviews = await Review.find().populate("userId", "username");
        res.status(200).json({ message: "Reviews fetched successfully", reviews });
    } catch (err) {
        res.status(500).json({ message: "Error fetching reviews", error: err.message });
    }
});

// Get reviews by user
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await Review.find({ userId }).populate("userId", "username");
        res.status(200).json({
            message: `Reviews for user ${userId} fetched successfully`,
            reviews,
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching reviews", error: err.message });
    }
});

// Get reviews by movie
router.get("/movie/:movieId", async (req, res) => {
    try {
        const { movieId } = req.params;
        console.log("Fetching reviews for movieId:", movieId);
        const reviews = await Review.find({ movieId }).populate("userId", "username _id");
        console.log("Found reviews:", reviews);

        // TEMP DEBUG: Show raw review data
        const rawReviews = await Review.find({ movieId });
        console.log("Raw reviews (no populate):", rawReviews);

        res.status(200).json({
            message: `Reviews for movie ${movieId} fetched successfully`,
            reviews,
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching movie reviews", error: err.message });
    }
});

// Edit a review
router.put("/:id", async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        if (review.userId.toString() !== req.body.userId)
            return res.status(403).json({ message: "Unauthorized" });

        review.rating = req.body.rating || review.rating;
        review.reviewText = req.body.reviewText || review.reviewText;
        await review.save();
        res.json({ message: "Review updated", review });
    } catch (err) {
        res.status(500).json({ message: "Error updating review", error: err.message });
    }
});

// Delete a review
router.delete("/:id", async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        if (review.userId.toString() !== req.body.userId)
            return res.status(403).json({ message: "Unauthorized" });

        await review.remove();
        res.json({ message: "Review deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting review", error: err.message });
    }
});

// Like a review
router.post("/:id/like", async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        const userId = req.body.userId;

        if (!review.likes.includes(userId)) {
            review.likes.push(userId);
            review.dislikes = review.dislikes.filter(id => id.toString() !== userId);
            await review.save();
        }

        res.json(review);
    } catch (err) {
        res.status(500).json({ message: "Error liking review", error: err.message });
    }
});

// Dislike a review
router.post("/:id/dislike", async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        const userId = req.body.userId;

        if (!review.dislikes.includes(userId)) {
            review.dislikes.push(userId);
            review.likes = review.likes.filter(id => id.toString() !== userId);
            await review.save();
        }

        res.json(review);
    } catch (err) {
        res.status(500).json({ message: "Error disliking review", error: err.message });
    }
});

// Flag a review for admin moderation
router.put("/:id/flag", async (req, res) => {
    try {
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            { flagged: true },
            { new: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.json({ message: "Review flagged", review: updatedReview });
    } catch (err) {
        res.status(500).json({ message: "Error flagging review", error: err.message });
    }
});

module.exports = router;