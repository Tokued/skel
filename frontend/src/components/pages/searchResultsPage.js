import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const OMDB_API_KEY = "1d0ab4bc";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const query = params.get("query") || "";
  const category = params.get("category") || "All";
  const genre = params.get("genre") || "";
  const year = params.get("year") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(year);
  const [genreLabel, setGenreLabel] = useState("");

  useEffect(() => {
    setSelectedYear(year);
  }, [year]);

  useEffect(() => {
    const fetchOmdbSearchResults = async () => {
      if (!query.trim() && !genre.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setGenreLabel("");

        const res = await axios.get("https://www.omdbapi.com/", {
          params: {
            apikey: OMDB_API_KEY,
            s: query,
          },
        });

        let formatted = [];

        if (res.data.Search) {
          formatted = res.data.Search
            .filter((movie) => movie.Type === "movie" || movie.Type === "series")
            .map((movie) => ({
              id: movie.imdbID,
              title: movie.Title,
              year: movie.Year,
              poster: movie.Poster,
              type: movie.Type,
              imdbRating: null,
            }));

          if (category === "Movies") {
            formatted = formatted.filter((m) => m.type === "movie");
          } else if (category === "Series") {
            formatted = formatted.filter((m) => m.type === "series");
          }

          if (year) {
            formatted = formatted.filter((m) =>
              String(m.year).includes(year)
            );
          }
        }

        setResults(formatted);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTmdbGenreBucket = async ({
      mediaType,
      genreName,
      queryText,
      selectedYearParam,
    }) => {
      const genreListRes = await axios.get(
        `https://api.themoviedb.org/3/genre/${mediaType}/list`,
        {
          params: {
            api_key: TMDB_API_KEY,
            language: "en-US",
          },
        }
      );

      const matchedGenre = (genreListRes.data.genres || []).find(
        (g) => g.name.toLowerCase() === genreName.toLowerCase()
      );

      if (!matchedGenre) {
        return [];
      }

     const discoverParams = {
      api_key: TMDB_API_KEY,
      language: "en-US",
      with_genres: matchedGenre.id,
      include_adult: false,
      page: 1,
      sort_by: "popularity.desc",
};

if (selectedYearParam) {
  if (mediaType === "movie") {
    discoverParams.primary_release_year = selectedYearParam;
  } else {
    discoverParams.first_air_date_year = selectedYearParam;
  }
}

const discoverRes = await axios.get(
  `https://api.themoviedb.org/3/discover/${mediaType}`,
  {
    params: discoverParams,
  }
);

      const tmdbItems = discoverRes.data.results || [];

      const enriched = await Promise.all(
        tmdbItems.slice(0, 24).map(async (item) => {
          try {
            const externalIdsRes = await axios.get(
              `https://api.themoviedb.org/3/${mediaType}/${item.id}/external_ids`,
              {
                params: {
                  api_key: TMDB_API_KEY,
                },
              }
            );

            const imdbID = externalIdsRes.data.imdb_id;

            let omdbItem = null;

            if (imdbID) {
              try {
                const omdbRes = await axios.get("https://www.omdbapi.com/", {
                  params: {
                    apikey: OMDB_API_KEY,
                    i: imdbID,
                  },
                });

                omdbItem = omdbRes.data;
              } catch (err) {
                console.error(`OMDb enrichment failed for ${item.title || item.name}:`, err);
              }
            }

            const title = omdbItem?.Title || item.title || item.name || "Untitled";
            const itemYear =
              omdbItem?.Year && omdbItem.Year !== "N/A"
                ? omdbItem.Year
                : mediaType === "movie"
                ? item.release_date
                  ? item.release_date.slice(0, 4)
                  : "N/A"
                : item.first_air_date
                ? item.first_air_date.slice(0, 4)
                : "N/A";

            return {
              id: imdbID || item.id,
              imdbID: imdbID || null,
              title,
              year: itemYear,
              poster: item.poster_path
                ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                : omdbItem?.Poster && omdbItem.Poster !== "N/A"
                ? omdbItem.Poster
                : null,
              type: mediaType === "movie" ? "movie" : "series",
              imdbRating: omdbItem?.imdbRating || "N/A",
            };
          } catch (err) {
            console.error(`Error enriching ${item.title || item.name}:`, err);

            return {
              id: item.id,
              imdbID: null,
              title: item.title || item.name || "Untitled",
              year:
                mediaType === "movie"
                  ? item.release_date
                    ? item.release_date.slice(0, 4)
                    : "N/A"
                  : item.first_air_date
                  ? item.first_air_date.slice(0, 4)
                  : "N/A",
              poster: item.poster_path
                ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                : null,
              type: mediaType === "movie" ? "movie" : "series",
              imdbRating: "N/A",
            };
          }
        })
      );

      let cleaned = enriched.filter((item) => item !== null);

      if (queryText.trim()) {
        cleaned = cleaned.filter((item) =>
          item.title.toLowerCase().includes(queryText.toLowerCase())
        );
      }

      return cleaned;
    };

    const fetchGenreResults = async () => {
      if (!genre.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      if (!TMDB_API_KEY) {
        console.error("Missing REACT_APP_TMDB_API_KEY");
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setGenreLabel(genre);

        let combinedResults = [];

        if (category === "Movies") {
          combinedResults = await fetchTmdbGenreBucket({
            mediaType: "movie",
            genreName: genre,
            queryText: query,
            selectedYearParam: year,
          });
        } else if (category === "Series") {
  combinedResults = await fetchTmdbGenreBucket({
    mediaType: "tv",
    genreName: genre,
    queryText: query,
    selectedYearParam: year,
  });
} else {
          const [movieResults, tvResults] = await Promise.all([
            fetchTmdbGenreBucket({
  mediaType: "movie",
  genreName: genre,
  queryText: query,
  selectedYearParam: year,
}),
fetchTmdbGenreBucket({
  mediaType: "tv",
  genreName: genre,
  queryText: query,
  selectedYearParam: year,
}),
          ]);

          combinedResults = [...movieResults, ...tvResults];
        }

        if (year) {
          combinedResults = combinedResults.filter((item) =>
            String(item.year).includes(year)
          );
        }

        combinedResults.sort((a, b) => {
          const ratingA = parseFloat(a.imdbRating) || 0;
          const ratingB = parseFloat(b.imdbRating) || 0;
          return ratingB - ratingA;
        });

        setResults(combinedResults);
      } catch (err) {
        console.error("Error fetching genre results:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (genre) {
      fetchGenreResults();
    } else {
      fetchOmdbSearchResults();
    }
  }, [query, category, genre, year]);

  const availableYears = useMemo(() => {
    return [...new Set(results.map((movie) => movie.year))]
      .filter(Boolean)
      .sort((a, b) => {
        const yearA = parseInt(String(a).slice(0, 4), 10) || 0;
        const yearB = parseInt(String(b).slice(0, 4), 10) || 0;
        return yearB - yearA;
      });
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!selectedYear) return results;
    return results.filter((movie) =>
      String(movie.year).includes(selectedYear)
    );
  }, [results, selectedYear]);

  const headingText = genre
    ? query
      ? `Genre: ${genreLabel || genre} for "${query}"`
      : `Genre: ${genreLabel || genre}`
    : `Search results for "${query}"`;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>{headingText}</h1>
            {genre ? (
              <p style={styles.subheading}>
                Sorted by IMDb rating. Filter by release year below.
              </p>
            ) : null}
          </div>

          {availableYears.length > 0 ? (
            <div style={styles.filterWrap}>
              <label style={styles.filterLabel}>Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={styles.select}
              >
                <option value="">All Years</option>
                {availableYears.map((itemYear) => (
                  <option key={itemYear} value={String(itemYear).slice(0, 4)}>
                    {String(itemYear).slice(0, 4)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {loading ? (
          <p style={styles.message}>Loading...</p>
        ) : filteredResults.length === 0 ? (
          <p style={styles.message}>No results found.</p>
        ) : (
          <div style={styles.grid}>
            {filteredResults.map((movie) => (
              <div
                key={movie.id}
                style={styles.card}
                onClick={() => navigate(`/movies/${movie.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {movie.poster && movie.poster !== "N/A" ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    style={styles.poster}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={styles.noPoster}>No Image</div>
                )}

                <div style={styles.cardContent}>
                  <h3 style={styles.title}>{movie.title}</h3>
                  <p style={styles.subtitle}>
                    {movie.year} • {movie.type}
                  </p>
                  {genre ? (
                    <p style={styles.rating}>
                      IMDb: {movie.imdbRating && movie.imdbRating !== "N/A" ? movie.imdbRating : "N/A"}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: "#0f0f0f",
    minHeight: "100vh",
    color: "white",
    padding: "30px",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  heading: {
    fontSize: "36px",
    marginBottom: "8px",
  },
  subheading: {
    fontSize: "15px",
    color: "#bdbdbd",
    margin: 0,
  },
  filterWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "180px",
  },
  filterLabel: {
    fontSize: "14px",
    color: "#bdbdbd",
  },
  select: {
    backgroundColor: "#1e1e1e",
    color: "white",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
  },
  message: {
    fontSize: "18px",
    color: "#bdbdbd",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  poster: {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    display: "block",
  },
  noPoster: {
    width: "100%",
    height: "300px",
    backgroundColor: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ccc",
  },
  cardContent: {
    padding: "12px",
  },
  title: {
    fontSize: "18px",
    marginBottom: "8px",
    color: "#fff",
  },
  subtitle: {
    fontSize: "14px",
    color: "#aaa",
    marginBottom: "6px",
  },
  rating: {
    fontSize: "14px",
    color: "#f5c518",
    margin: 0,
  },
};

export default SearchResultsPage;