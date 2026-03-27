const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/search", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: query,
      },
    });

    if (response.data.Response === "False") {
      return res.json([]);
    }

    const movies = response.data.Search.map((movie) => ({
      id: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster,
    }));

    res.json(movies);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error fetching movies" });
  }
});

router.get("/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: movieId,
      },
    });

    if (response.data.Response === "False") {
      return res.status(404).json({ message: "Movie not found" });
    }

    const movie = {
      id: response.data.imdbID,
      title: response.data.Title,
      year: response.data.Year,
      poster: response.data.Poster,
      plot: response.data.Plot,
      rating: response.data.imdbRating,
      runtime: response.data.Runtime,
      genre: response.data.Genre,
    };

    res.json(movie);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error fetching movie" });
  }
});

module.exports = router;