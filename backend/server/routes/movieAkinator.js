const express = require("express");
const axios = require("axios");

const router = express.Router();

const TMDB_API_KEY =
  process.env.TMDB_API_KEY || process.env.REACT_APP_TMDB_API_KEY;

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

async function tmdbGet(path, params = {}) {
  const res = await axios.get(`https://api.themoviedb.org/3${path}`, {
    params: {
      api_key: TMDB_API_KEY,
      language: "en-US",
      include_adult: false,
      ...params,
    },
  });

  return res.data;
}

async function addResultsFromEndpoint(path, params = {}, pages = 1) {
  let results = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const data = await tmdbGet(path, { ...params, page });
      results = [...results, ...(data.results || [])];
    } catch (err) {
      console.error(`TMDb fetch failed: ${path}`, err.message);
    }
  }

  return results;
}

router.get("/pool", async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({ message: "Missing TMDb API key" });
    }

    let combined = [];

    const endpointPools = await Promise.all([
      addResultsFromEndpoint("/movie/popular", {}, 5),
      addResultsFromEndpoint("/movie/top_rated", {}, 8),
      addResultsFromEndpoint("/movie/now_playing", {}, 2),
      addResultsFromEndpoint("/movie/upcoming", {}, 2),

      addResultsFromEndpoint("/discover/movie", {
        sort_by: "vote_average.desc",
        vote_count_gte: 500,
      }, 5),

      addResultsFromEndpoint("/discover/movie", {
        sort_by: "popularity.desc",
        vote_count_gte: 100,
      }, 5),

      addResultsFromEndpoint("/discover/movie", {
        with_genres: 18,
        sort_by: "vote_average.desc",
        vote_count_gte: 300,
      }, 4),

      addResultsFromEndpoint("/discover/movie", {
        with_genres: 35,
        sort_by: "popularity.desc",
        vote_count_gte: 100,
      }, 3),

      addResultsFromEndpoint("/discover/movie", {
        with_genres: 27,
        sort_by: "popularity.desc",
        vote_count_gte: 100,
      }, 3),

      addResultsFromEndpoint("/discover/movie", {
        with_genres: 878,
        sort_by: "popularity.desc",
        vote_count_gte: 100,
      }, 4),

      addResultsFromEndpoint("/discover/movie", {
        with_genres: 10749,
        sort_by: "vote_average.desc",
        vote_count_gte: 150,
      }, 3),

      addResultsFromEndpoint("/discover/movie", {
        with_genres: 10751,
        sort_by: "popularity.desc",
        vote_count_gte: 100,
      }, 3),

      addResultsFromEndpoint("/discover/movie", {
        with_keywords: "9717",
        sort_by: "popularity.desc",
      }, 2),

      addResultsFromEndpoint("/discover/movie", {
        with_keywords: "818",
        sort_by: "popularity.desc",
      }, 2),

      addResultsFromEndpoint("/discover/movie", {
        with_keywords: "1612",
        sort_by: "popularity.desc",
      }, 2),
    ]);

    endpointPools.forEach((pool) => {
      combined = [...combined, ...pool];
    });

    const decadeRequests = [];

    for (let year = 1930; year <= 2026; year += 10) {
      decadeRequests.push(
        addResultsFromEndpoint("/discover/movie", {
          sort_by: "popularity.desc",
          "primary_release_date.gte": `${year}-01-01`,
          "primary_release_date.lte": `${year + 9}-12-31`,
          vote_count_gte: 100,
        }, 2)
      );

      decadeRequests.push(
        addResultsFromEndpoint("/discover/movie", {
          sort_by: "vote_average.desc",
          "primary_release_date.gte": `${year}-01-01`,
          "primary_release_date.lte": `${year + 9}-12-31`,
          vote_count_gte: 300,
        }, 2)
      );
    }

    const decadePools = await Promise.all(decadeRequests);

    decadePools.forEach((pool) => {
      combined = [...combined, ...pool];
    });

    const mustIncludeTitles = [
      "Dead Poets Society",
      "Good Will Hunting",
      "The Breakfast Club",
      "Stand by Me",
      "The Shawshank Redemption",
      "Forrest Gump",
      "The Green Mile",
      "The Truman Show",
      "The Perks of Being a Wallflower",
      "The Pursuit of Happyness",
      "A Beautiful Mind",
      "The Social Network",
      "Whiplash",
      "La La Land",
      "The Godfather",
      "Pulp Fiction",
      "Fight Club",
      "Titanic",
      "The Matrix",
      "Jurassic Park",
      "Star Wars",
      "The Empire Strikes Back",
      "Return of the Jedi",
      "Alien",
      "Aliens",
      "Blade Runner",
      "Back to the Future",
      "The Lord of the Rings",
      "Harry Potter",
      "Batman",
      "Spider-Man",
      "Avengers",
      "Scream",
      "Halloween",
      "The Evil Dead",
      "Resident Evil"
    ];

    const searchPools = await Promise.all(
      mustIncludeTitles.map((title) =>
        tmdbGet("/search/movie", {
          query: title,
          page: 1,
        }).catch(() => ({ results: [] }))
      )
    );

    searchPools.forEach((data) => {
      combined = [...combined, ...(data.results || []).slice(0, 3)];
    });

    const unique = Object.values(
      combined.reduce((acc, movie) => {
        if (movie?.id && movie.poster_path && movie.release_date) {
          acc[movie.id] = movie;
        }
        return acc;
      }, {})
    );

    const baseMovies = unique
      .sort((a, b) => {
        const scoreA =
          Number(a.popularity || 0) +
          Number(a.vote_average || 0) * 20 +
          Number(a.vote_count || 0) / 100;

        const scoreB =
          Number(b.popularity || 0) +
          Number(b.vote_average || 0) * 20 +
          Number(b.vote_count || 0) / 100;

        return scoreB - scoreA;
      })
      .slice(0, 500);

    const movies = await Promise.all(
      baseMovies.map(async (movie) => {
        let cast = [];
        let director = "";
        let keywordNames = [];
        let runtime = 0;
        let belongsToCollection = false;
        let tagline = "";

        try {
          const [details, credits, keywords] = await Promise.all([
            tmdbGet(`/movie/${movie.id}`),
            tmdbGet(`/movie/${movie.id}/credits`),
            tmdbGet(`/movie/${movie.id}/keywords`),
          ]);

          runtime = details?.runtime || 0;
          belongsToCollection = !!details?.belongs_to_collection;
          tagline = details?.tagline || "";

          cast = (credits?.cast || []).slice(0, 12).map((actor) => ({
            name: actor.name,
            character: actor.character,
          }));

          const directorObj = (credits?.crew || []).find(
            (person) => person.job === "Director"
          );

          director = directorObj?.name || "";

          keywordNames = (keywords?.keywords || [])
            .slice(0, 40)
            .map((keyword) => keyword.name);
        } catch (err) {
          console.error(`Metadata failed for ${movie.title}:`, err.message);
        }

        return {
          tmdbID: movie.id,
          title: movie.title,
          year: movie.release_date ? movie.release_date.slice(0, 4) : "N/A",
          releaseDate: movie.release_date,
          poster: `${TMDB_IMAGE_BASE}${movie.poster_path}`,
          overview: movie.overview || "",
          tagline,
          genreIds: movie.genre_ids || [],
          rating: movie.vote_average || 0,
          voteCount: movie.vote_count || 0,
          popularity: movie.popularity || 0,
          runtime,
          cast,
          director,
          keywordNames,
          belongsToCollection,
        };
      })
    );

    res.json(movies);
  } catch (err) {
    console.error("Movie Akinator pool error:", err);
    res.status(500).json({ message: "Failed to load movie pool" });
  }
});

module.exports = router;