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
  const searchText = params.get("query") || "";
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
      if (!searchText.trim()) {
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
            s: searchText.trim(),
          },
        });

        if (res.data.Response === "False" || !res.data.Search) {
          setResults([]);
          return;
        }

        const formatted = res.data.Search
          .filter((item) => item.Type === "movie" || item.Type === "series")
          .map((item) => ({
            id: item.imdbID,
            imdbID: item.imdbID,
            title: item.Title,
            year: item.Year,
            poster: item.Poster,
            type: item.Type,
            imdbRating: null,
            tmdbPopularity: 0,
          }));

        setResults(formatted);
      } catch (err) {
        console.error("Error fetching OMDb search results:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchFilterResults = async () => {
      if (!TMDB_API_KEY) {
        console.error("Missing TMDB API key");
        setResults([]);
        setLoading(false);
        return;
      }

      const hasAnyFilter =
        (category && category !== "All") ||
        !!year ||
        !!genre;

      if (!hasAnyFilter) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setGenreLabel(genre);

        let mediaTypes = [];

        if (category === "Movies") {
          mediaTypes = ["movie"];
        } else if (category === "Series") {
          mediaTypes = ["tv"];
        } else {
          mediaTypes = ["movie", "tv"];
        }

        const today = new Date().toISOString().split("T")[0];
        let combined = [];

        for (const mediaType of mediaTypes) {
          const discoverParams = {
            api_key: TMDB_API_KEY,
            language: "en-US",
            sort_by: "popularity.desc",
            include_adult: false,
            page: 1,
            vote_count_gte: 50,
          };

          if (year) {
            if (mediaType === "movie") {
              discoverParams.primary_release_year = year;
            } else {
              discoverParams.first_air_date_year = year;
            }
          } else {
            if (mediaType === "movie") {
              discoverParams["primary_release_date.lte"] = today;
            } else {
              discoverParams["first_air_date.lte"] = today;
            }
          }

          if (genre) {
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
              (g) => g.name.toLowerCase() === genre.toLowerCase()
            );

            if (!matchedGenre) {
              continue;
            }

            discoverParams.with_genres = matchedGenre.id;
          }

          const pageRequests = [1, 2].map((pageNumber) =>
            axios.get(`https://api.themoviedb.org/3/discover/${mediaType}`, {
              params: {
                ...discoverParams,
                page: pageNumber,
              },
            })
          );

          const pageResponses = await Promise.all(pageRequests);

          for (const response of pageResponses) {
            const discoveredItems = (response.data.results || []).map((item) => ({
              ...item,
              __mediaType: mediaType,
            }));

            combined = [...combined, ...discoveredItems];
          }
        }

        const unique = Object.values(
          combined.reduce((acc, item) => {
            const key = `${item.__mediaType}-${item.id}`;
            acc[key] = item;
            return acc;
          }, {})
        );

        const enriched = await Promise.all(
          unique.slice(0, 60).map(async (item) => {
            try {
              let imdbID = null;
              let omdbItem = null;

              try {
                const externalIdsRes = await axios.get(
                  `https://api.themoviedb.org/3/${item.__mediaType}/${item.id}/external_ids`,
                  {
                    params: {
                      api_key: TMDB_API_KEY,
                    },
                  }
                );

                imdbID = externalIdsRes.data.imdb_id || null;
              } catch (err) {
                console.error("TMDB external_ids error:", err);
              }

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

              const resolvedYear =
                omdbItem?.Year && omdbItem.Year !== "N/A"
                  ? omdbItem.Year
                  : item.__mediaType === "movie"
                  ? item.release_date
                    ? item.release_date.slice(0, 4)
                    : "N/A"
                  : item.first_air_date
                  ? item.first_air_date.slice(0, 4)
                  : "N/A";

              return {
                id: imdbID || `${item.__mediaType}-${item.id}`,
                imdbID: imdbID || null,
                title: omdbItem?.Title || item.title || item.name || "Untitled",
                year: resolvedYear,
                poster: item.poster_path
                  ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                  : omdbItem?.Poster && omdbItem.Poster !== "N/A"
                  ? omdbItem.Poster
                  : null,
                type: omdbItem?.Type || (item.__mediaType === "movie" ? "movie" : "series"),
                imdbRating: omdbItem?.imdbRating || "N/A",
                tmdbPopularity: item.popularity || 0,
              };
            } catch (err) {
              console.error(`Error enriching ${item.title || item.name}:`, err);
              return null;
            }
          })
        );

        const cleaned = enriched
  .filter((item) => item && item.poster)
  .sort((a, b) => {
    const ratingA = parseFloat(a.imdbRating) || 0;
    const ratingB = parseFloat(b.imdbRating) || 0;

    return ratingB - ratingA;
  });
        setResults(cleaned);
      } catch (err) {
        console.error("Error fetching filter results:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (searchText.trim()) {
      fetchOmdbSearchResults();
    } else {
      fetchFilterResults();
    }
  }, [searchText, category, genre, year]);

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

  const headingText = searchText
    ? `Search results for "${searchText}"`
    : genre
    ? `Genre: ${genreLabel || genre}`
    : "Filtered Results";

  const subheadingText = searchText
    ? ""
    : genre
    ? "Sorted by IMDb rating. Filter by release year below."
    : "Sorted by popularity. Filter by release year below.";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>{headingText}</h1>
            {subheadingText ? (
              <p style={styles.subheading}>{subheadingText}</p>
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
                style={{
                  ...styles.card,
                  cursor: movie.imdbID ? "pointer" : "default",
                }}
                onClick={() => {
                  if (movie.imdbID) {
                    navigate(`/movies/${movie.imdbID}`);
                  }
                }}
                onMouseEnter={(e) => {
                  if (movie.imdbID) {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.5)";
                  }
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
                  {movie.imdbRating && movie.imdbRating !== "N/A" ? (
                    <p style={styles.rating}>IMDb: {movie.imdbRating}</p>
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