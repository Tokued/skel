const express = require("express");
const router = express.Router();
const Review = require("../models/review.model");

// Add a review
router.post("/add", async (req, res) => {
    try {
        const { movieId, userId, rating, reviewText } = req.body;
        const newReview = new Review({ movieId, userId, rating, reviewText });
        const savedReview = await newReview.save();
        res.status(201).json({ message: "Review added successfully", review: savedReview });
    } catch (err) {
        res.status(500).json({ message: "Error adding review", error: err.message });
    }
});

// Get all reviews
router.get("/all", async (req, res) => {
    try {
        const reviews = await Review.find();
        res.status(200).json({ message: "Reviews fetched successfully", reviews });
    } catch (err) {
        res.status(500).json({ message: "Error fetching reviews", error: err.message });
    }
});

// Get reviews by user
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await Review.find({ userId });
        res.status(200).json({
            message: `Reviews for user ${userId} fetched successfully`,
            reviews,
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching reviews", error: err.message });
    }
});

module.exports = router;