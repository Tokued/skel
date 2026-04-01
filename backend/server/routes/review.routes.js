const express = require("express");
const router = express.Router();
const Review = require("../models/review.model");

// ---------------------- Add a Review ----------------------
router.post("/add", async (req, res) => {
    console.log("Received review:", req.body);

    try {
        const { movieId, userId, rating, reviewText } = req.body;

        if (!movieId || !userId || !rating || !reviewText) {
            return res.status(400).json({ 
                message: "Missing required fields: movieId, userId, rating, reviewText" 
            });
        }

        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ 
                message: "Rating must be a number between 1 and 5" 
            });
        }

        const newReview = new Review({ 
            movieId, 
            userId, 
            rating: numericRating, 
            reviewText 
        });

        const savedReview = await newReview.save();
        console.log("Saved review:", savedReview);

        res.status(201).json({ 
            message: "Review added successfully", 
            review: savedReview 
        });

    } catch (err) {
        console.error("Error saving review:", err);
        res.status(500).json({ 
            message: "Error adding review", 
            error: err.message 
        });
    }
});

// ---------------------- Get All Reviews ----------------------
router.get("/all", async (req, res) => {
    try {
        const reviews = await Review.find();
        res.status(200).json({ 
            message: "Reviews fetched successfully", 
            reviews 
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error fetching reviews", 
            error: err.message 
        });
    }
});

// ---------------------- Get Reviews for a Movie ----------------------
router.get("/movie/:movieId", async (req, res) => {
    try {
        const { movieId } = req.params;
        const reviews = await Review.find({ movieId });

        res.status(200).json({ 
            message: "Reviews fetched successfully", 
            reviews 
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error fetching reviews", 
            error: err.message 
        });
    }
});

// ---------------------- Get Reviews by User ----------------------
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await Review.find({ userId });

        res.status(200).json({
            message: "User reviews fetched successfully",
            reviews
        });
    } catch (err) {
        res.status(500).json({
            message: "Error fetching user reviews",
            error: err.message
        });
    }
});

module.exports = router;