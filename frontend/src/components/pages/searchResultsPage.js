import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const OMDB_API_KEY = "96e6cc14";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_POSTER_BG_BASE = "https://image.tmdb.org/t/p/original";

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const searchText = params.get("query") || "";
  const category = params.get("category") || "All";
  const genre = params.get("genre") || "";
  const year = params.get("year") || "";

  const [results, setResults] = useState([]);
  const [bgPosters, setBgPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(year);
  const [genreLabel, setGenreLabel] = useState("");

  useEffect(() => {
    setSelectedYear(year);
  }, [year]);

  useEffect(() => {
    const fetchBackgroundPosters = async () => {
      try {
        const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

        const discoverRequests = years.map((year) =>
          axios.get("https://api.themoviedb.org/3/discover/movie", {
            params: {
              api_key: TMDB_API_KEY,
              language: "en-US",
              sort_by: "popularity.desc",
              include_adult: false,
              include_video: false,
              page: 1,
              primary_release_year: year,
              vote_count_gte: 80,
            },
          })
        );

        const discoverResponses = await Promise.all(discoverRequests);

        const mixedPopular = discoverResponses.flatMap((res) =>
          (res.data?.results || []).slice(0, 8)
        );

        const uniquePopular = Object.values(
          mixedPopular.reduce((acc, movie) => {
            acc[movie.id] = movie;
            return acc;
          }, {})
        );

        const posters = uniquePopular
          .filter((m) => m.poster_path)
          .sort(() => 0.5 - Math.random())
          .slice(0, 45)
          .map((m) => `${TMDB_POSTER_BG_BASE}${m.poster_path}`);

        setBgPosters(posters);
      } catch (err) {
        console.error("Error loading search background posters:", err);
      }
    };

    fetchBackgroundPosters();
  }, []);

  useEffect(() => {
    if (bgPosters.length === 0) return;

    const interval = setInterval(() => {
      setBgPosters((prev) => [...prev].sort(() => 0.5 - Math.random()));
    }, 8000);

    return () => clearInterval(interval);
  }, [bgPosters.length]);

  useEffect(() => {
    const getExactnessScore = (title, query) => {
      const cleanTitle = title.toLowerCase().trim();
      const cleanQuery = query.toLowerCase().trim();

      if (cleanTitle === cleanQuery) return 100;
      if (cleanTitle.startsWith(cleanQuery)) return 75;
      if (cleanTitle.includes(cleanQuery)) return 50;

      return 0;
    };

    const fetchTmdbSearchResults = async () => {
      if (!TMDB_API_KEY) {
        console.error("Missing TMDB API key");
        setResults([]);
        setLoading(false);
        return;
      }

      if (!searchText.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setGenreLabel("");

        const pageRequests = [1, 2].map((pageNumber) =>
          axios.get("https://api.themoviedb.org/3/search/multi", {
            params: {
              api_key: TMDB_API_KEY,
              query: searchText.trim(),
              include_adult: false,
              language: "en-US",
              page: pageNumber,
            },
          })
        );

        const pageResponses = await Promise.all(pageRequests);

        let combined = [];

        pageResponses.forEach((response) => {
          combined = [...combined, ...(response.data?.results || [])];
        });

        const filtered = combined.filter(
          (item) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            item.poster_path
        );

        const unique = Object.values(
          filtered.reduce((acc, item) => {
            const key = `${item.media_type}-${item.id}`;
            acc[key] = item;
            return acc;
          }, {})
        );

        const enriched = await Promise.all(
          unique.map(async (item) => {
            const mediaType = item.media_type;

            let imdbID = null;
            let omdbItem = null;

            try {
              const externalIdsRes = await axios.get(
                `https://api.themoviedb.org/3/${mediaType}/${item.id}/external_ids`,
                {
                  params: {
                    api_key: TMDB_API_KEY,
                  },
                }
              );

              imdbID = externalIdsRes.data?.imdb_id || null;
            } catch (err) {
              console.error("TMDb external_ids error:", err);
            }

            if (imdbID) {
              try {
                const omdbRes = await axios.get("https://www.omdbapi.com/", {
                  params: {
                    apikey: OMDB_API_KEY,
                    i: imdbID,
                  },
                });

                if (omdbRes.data?.Response !== "False") {
                  omdbItem = omdbRes.data;
                }
              } catch (err) {
                console.error("OMDb enrichment error:", err);
              }
            }

            const title = omdbItem?.Title || item.title || item.name || "Untitled";

            const resolvedYear =
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
              id: imdbID || `${mediaType}-${item.id}`,
              tmdbID: item.id,
              imdbID,
              title,
              year: resolvedYear,
              poster: item.poster_path
                ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                : omdbItem?.Poster && omdbItem.Poster !== "N/A"
                ? omdbItem.Poster
                : null,
              type: mediaType === "movie" ? "movie" : "series",
              imdbRating: omdbItem?.imdbRating || "N/A",
              tmdbPopularity: item.popularity || 0,
              exactnessScore: getExactnessScore(title, searchText),
            };
          })
        );

        const cleaned = enriched
          .filter((item) => item && item.poster && item.imdbID)
          .sort((a, b) => {
            if (b.exactnessScore !== a.exactnessScore) {
              return b.exactnessScore - a.exactnessScore;
            }

            return b.tmdbPopularity - a.tmdbPopularity;
          });

        setResults(cleaned);
      } catch (err) {
        console.error("Error fetching TMDb search results:", err);
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

      const hasAnyFilter = (category && category !== "All") || !!year || !!genre;

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

            if (!matchedGenre) continue;

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

                  if (omdbRes.data?.Response !== "False") {
                    omdbItem = omdbRes.data;
                  }
                } catch (err) {
                  console.error("OMDb enrichment failed:", err);
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
                tmdbID: item.id,
                imdbID: imdbID || null,
                title: omdbItem?.Title || item.title || item.name || "Untitled",
                year: resolvedYear,
                poster: item.poster_path
                  ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                  : omdbItem?.Poster && omdbItem.Poster !== "N/A"
                  ? omdbItem.Poster
                  : null,
                type:
                  omdbItem?.Type ||
                  (item.__mediaType === "movie" ? "movie" : "series"),
                imdbRating: omdbItem?.imdbRating || "N/A",
                tmdbPopularity: item.popularity || 0,
              };
            } catch (err) {
              console.error("Error enriching result:", err);
              return null;
            }
          })
        );

        const cleaned = enriched
          .filter((item) => item && item.poster && item.imdbID)
          .sort((a, b) => {
            const ratingA = parseFloat(a.imdbRating) || 0;
            const ratingB = parseFloat(b.imdbRating) || 0;

            if (ratingB !== ratingA) return ratingB - ratingA;

            return b.tmdbPopularity - a.tmdbPopularity;
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
      fetchTmdbSearchResults();
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
    return results.filter((movie) => String(movie.year).includes(selectedYear));
  }, [results, selectedYear]);

  const headingText = searchText
    ? `Search results for "${searchText}"`
    : genre
    ? `Genre: ${genreLabel || genre}`
    : "Filtered Results";

  const subheadingText = searchText
    ? "Powered by TMDb search and enriched with OMDb details when available."
    : genre
    ? "Sorted by IMDb rating. Filter by release year below."
    : "Sorted by popularity. Filter by release year below.";

  return (
    <div style={styles.page}>
      <div style={styles.posterBackground}>
        {bgPosters.map((poster, i) => (
          <div
            key={i}
            style={{
              ...styles.posterTile,
              backgroundImage: `url(${poster})`,
            }}
          />
        ))}
      </div>

      <div style={styles.posterOverlay} />

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
                style={styles.card}
                onClick={() => navigate(`/movies/${movie.imdbID}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 24px rgba(0,0,0,0.65)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.35)";
                }}
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  style={styles.poster}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

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
    position: "relative",
    backgroundColor: "#0f0f0f",
    minHeight: "100vh",
    color: "white",
    padding: "100px 30px 30px",
    overflow: "hidden",
  },

  posterBackground: {
    position: "fixed",
    inset: 0,
    display: "grid",
    gridTemplateColumns: "repeat(9, 1fr)",
    gap: "0px",
    zIndex: 0,
    pointerEvents: "none",
  },

  posterTile: {
    aspectRatio: "2 / 3",
    backgroundSize: "contain",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    filter: "brightness(0.35) blur(0.4px)",
    opacity: 0.45,
    transition: "background-image 0.8s ease-in-out",
  },

  posterOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.82), rgba(0,0,0,0.78), rgba(0,0,0,0.9))",
    zIndex: 1,
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    zIndex: 2,
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
    textShadow: "0 4px 18px rgba(0,0,0,0.8)",
  },

  subheading: {
    fontSize: "15px",
    color: "#bdbdbd",
    margin: 0,
    textShadow: "0 3px 12px rgba(0,0,0,0.8)",
  },

  filterWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "180px",
  },

  filterLabel: {
    fontSize: "14px",
    color: "#d0d0d0",
  },

  select: {
    backgroundColor: "rgba(30,30,30,0.9)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.15)",
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
    backgroundColor: "rgba(30, 30, 30, 0.92)",
    borderRadius: "12px",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  poster: {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    display: "block",
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