router.post("/add", async (req, res) => {
  try {
    const { movieId, userId, rating, reviewText } = req.body;

    const newReview = new Review({
      movieId,
      userId,
      rating,
      reviewText,
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      message: "Review added successfully",
      review: savedReview,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error adding review",
      error: err.message,
    });
  }
});