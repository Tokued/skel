router.post("/add", async (req, res) => {
  try {
    const { title, description, director, rating, poster } = req.body;

    const newMovie = new newMovieModel({
      title,
      description,
      director,
      rating,
      poster,
    });

    const savedMovie = await newMovie.save();

    res.status(201).json({
      message: "Movie added successfully",
      movie: savedMovie,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error adding movie",
      error: err.message,
    });
  }
});