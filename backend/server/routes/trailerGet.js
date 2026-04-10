const express = require("express");
const router = express.Router();
const axios = require("axios");

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// GET trailer using imdbID
router.get("/:imdbID", async (req, res) => {
  try {
    const { imdbID } = req.params;

    // 1. convert imdbID -> tmdb id
    const findRes = await axios.get(
      `https://api.themoviedb.org/3/find/${imdbID}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          external_source: "imdb_id"
        }
      }
    );

    const movie = findRes.data.movie_results[0];

    if (!movie) {
      return res.json({ trailer: null });
    }

    // 2. get trailers
    const videoRes = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}/videos`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US"
        }
      }
    );

    // 3. pick best trailer
    const results = videoRes.data.results || [];

    const trailer =
      results.find(
        (vid) =>
          vid.type === "Trailer" &&
          vid.site === "YouTube" &&
          vid.official === true &&
          vid.iso_639_1 === "en"
      ) ||
      results.find(
        (vid) =>
          vid.type === "Trailer" &&
          vid.site === "YouTube" &&
          vid.iso_639_1 === "en"
      ) ||
      results.find(
        (vid) =>
          vid.type === "Trailer" &&
          vid.site === "YouTube"
      );

    if (!trailer) {
      return res.json({ trailer: null });
    }

    res.json({
      youtubeId: trailer.key,
      name: trailer.name
    });
  } catch (error) {
    console.error("TMDb error:", error.message);
    res.status(500).json({ message: "Failed to fetch trailer" });
  }
});

module.exports = router;