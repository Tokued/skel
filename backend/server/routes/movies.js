const express = require("express");
const axios = require("axios");
const router = express.Router();

// 🔎 SEARCH MOVIES
router.get("/search", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    const response = await axios.get("https://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: query,
      },
    });

    if (!response.data || response.data.Response === "False") {
      return res.json([]);
    }

    const filteredResults = (response.data.Search || []).filter(
      (item) => item.Type === "movie" || item.Type === "series"
    );

    const movies = filteredResults.map((movie) => ({
      id: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster,
      type: movie.Type,
    }));

    res.json(movies);
  } catch (err) {
    console.error("SEARCH ERROR:", err.message);
    res.status(500).json({ message: "Error fetching movies" });
  }
});

// 🎬 GET MOVIE BY ID
router.get("/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get("https://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: movieId,
      },
    });

    if (!response.data || response.data.Response === "False") {
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
    console.error("MOVIE ERROR:", err.message);
    res.status(500).json({ message: "Error fetching movie" });
  }
});

module.exports = router;