router.post("/add", async (req, res) => {
    const { title, description, director, rating, poster } = req.body;

    const newMovie = new newMovieModel({
      title,
      description,
      director,
      rating,
      poster,
    });

    const savedMovie = await newMovie.save();
});