const express = require("express");
const router = express.Router();
const axios = require("axios");

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// GET trailer using imdbID, with title fallback
router.get("/:imdbID", async (req, res) => {
  try {
    const { imdbID } = req.params;
    const { title } = req.query;

    let item = null;
    let mediaType = null;

    // 1. try imdbID -> tmdb
    if (imdbID && imdbID !== "unknown") {
      const findRes = await axios.get(
        `https://api.themoviedb.org/3/find/${imdbID}`,
        {
          params: {
            api_key: TMDB_API_KEY,
            external_source: "imdb_id",
          },
        }
      );

      const movie = findRes.data.movie_results?.[0];
      const tv = findRes.data.tv_results?.[0];

      item = movie || tv;
      mediaType = movie ? "movie" : tv ? "tv" : null;
    }

    // 2. fallback: search by title
    if ((!item || !mediaType) && title) {
      const movieSearchRes = await axios.get(
        `https://api.themoviedb.org/3/search/movie`,
        {
          params: {
            api_key: TMDB_API_KEY,
            query: title,
            language: "en-US",
            page: 1,
          },
        }
      );

      const foundMovie = movieSearchRes.data.results?.[0];

      if (foundMovie) {
        item = foundMovie;
        mediaType = "movie";
      }
    }

    // 3. optional fallback: tv title search
    if ((!item || !mediaType) && title) {
      const tvSearchRes = await axios.get(
        `https://api.themoviedb.org/3/search/tv`,
        {
          params: {
            api_key: TMDB_API_KEY,
            query: title,
            language: "en-US",
            page: 1,
          },
        }
      );

      const foundTv = tvSearchRes.data.results?.[0];

      if (foundTv) {
        item = foundTv;
        mediaType = "tv";
      }
    }

    if (!item || !mediaType) {
      return res.json({ trailer: null });
    }

    // 4. get trailers
    const videoRes = await axios.get(
      `https://api.themoviedb.org/3/${mediaType}/${item.id}/videos`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
        },
      }
    );

    const results = videoRes.data.results || [];

    const trailer =
      results.find(
        (vid) =>
          vid.site === "YouTube" &&
          vid.type === "Trailer" &&
          vid.official === true &&
          vid.iso_639_1 === "en"
      ) ||
      results.find(
        (vid) =>
          vid.site === "YouTube" &&
          vid.type === "Trailer" &&
          vid.iso_639_1 === "en"
      ) ||
      results.find(
        (vid) =>
          vid.site === "YouTube" &&
          vid.type === "Teaser" &&
          vid.iso_639_1 === "en"
      ) ||
      results.find(
        (vid) =>
          vid.site === "YouTube" &&
          vid.type === "Clip" &&
          vid.iso_639_1 === "en"
      ) ||
      results.find(
        (vid) =>
          vid.site === "YouTube" &&
          vid.type === "Featurette" &&
          vid.iso_639_1 === "en"
      ) ||
      results.find((vid) => vid.site === "YouTube");

    if (!trailer) {
      return res.json({ trailer: null });
    }

    res.json({
      youtubeId: trailer.key,
      name: trailer.name,
    });
  } catch (error) {
    console.error("TMDb error:", error.message);
    res.status(500).json({ message: "Failed to fetch trailer" });
  }
});

module.exports = router;