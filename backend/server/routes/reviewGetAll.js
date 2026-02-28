router.get("/all", async (req, res) => {
  try {
    const reviews = await Review.find();

    res.status(200).json({
      message: "Reviews fetched successfully",
      reviews: reviews,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching reviews",
      error: err.message,
    });
  }
});