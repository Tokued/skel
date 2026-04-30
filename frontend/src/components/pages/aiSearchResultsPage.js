import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const OMDB_API_KEY = "96e6cc14";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// ─────────────────────────────────────────
// Enrich a single title string with poster,
// year, imdb rating etc via TMDB + OMDB
// ─────────────────────────────────────────
async function enrichTitle(title) {
  try {
    // 1. Search TMDB for the title
    const searchRes = await axios.get("https://api.themoviedb.org/3/search/multi", {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        include_adult: false,
        language: "en-US",
        page: 1,
      },
    });

    const hit = (searchRes.data.results || []).find(
      (r) => r.media_type === "movie" || r.media_type === "tv"
    );

    if (!hit) return null;

    // 2. Get IMDB id from TMDB external ids
    const extRes = await axios.get(
      `https://api.themoviedb.org/3/${hit.media_type}/${hit.id}/external_ids`,
      { params: { api_key: TMDB_API_KEY } }
    );

    const imdbID = extRes.data?.imdb_id;

    // 3. Fetch OMDB for rich metadata
    let omdb = null;
    if (imdbID) {
      const omdbRes = await axios.get("https://www.omdbapi.com/", {
        params: { apikey: OMDB_API_KEY, i: imdbID },
      });
      if (omdbRes.data.Response === "True") omdb = omdbRes.data;
    }

    const year =
      omdb?.Year ||
      (hit.media_type === "movie"
        ? hit.release_date?.slice(0, 4)
        : hit.first_air_date?.slice(0, 4)) ||
      "N/A";

    const poster = hit.poster_path
      ? `${TMDB_IMAGE_BASE}${hit.poster_path}`
      : omdb?.Poster && omdb.Poster !== "N/A"
      ? omdb.Poster
      : null;

    return {
      id: imdbID || `tmdb-${hit.id}`,
      imdbID: imdbID || null,
      title: omdb?.Title || hit.title || hit.name || title,
      year,
      poster,
      type: omdb?.Type || (hit.media_type === "movie" ? "movie" : "series"),
      imdbRating: omdb?.imdbRating || "N/A",
    };
  } catch (err) {
    console.error(`Failed to enrich "${title}":`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────
const AiSearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const description = params.get("description") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const abortRef = useRef(false);

  useEffect(() => {
    if (!description.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    abortRef.current = false;
    setLoading(true);
    setResults([]);
    setError("");

    const run = async () => {
      // Step 1: get AI title list
      let movieTitles = [];
      try {
        const res = await axios.post("http://localhost:8081/ai/recommend", {
          description: description.trim(),
        });
        movieTitles = res.data.movies || [];
      } catch (err) {
        console.error("AI search failed:", err);
        setError("Could not reach the AI recommendation engine. Is your server running?");
        setLoading(false);
        return;
      }

      if (!movieTitles.length) {
        setError("The AI couldn't find recommendations for that description. Try rephrasing.");
        setLoading(false);
        return;
      }

      // Step 2: progressively enrich each title
      const enriched = await Promise.all(
        movieTitles.map((title) => enrichTitle(title))
      );

      if (abortRef.current) return;

      const filtered = enriched
        .filter((item) => item && item.poster)
        .sort((a, b) => {
          const ratingA = parseFloat(a.imdbRating) || 0;
          const ratingB = parseFloat(b.imdbRating) || 0;
          return ratingB - ratingA;
        });

      setResults(filtered);
      setLoading(false);
    };

    run();

    return () => {
      abortRef.current = true;
    };
  }, [description]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>AI Recommendations</h1>
            <p style={styles.subheading}>
              "{description}"
            </p>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <p style={{ margin: 0 }}>{error}</p>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Go Back
            </button>
          </div>
        )}

        {loading && !error && (
          <p style={styles.message}>Loading AI recommendations...</p>
        )}

        {!loading && !error && results.length === 0 && (
          <p style={styles.message}>No results found with available poster data.</p>
        )}

        {!loading && !error && results.length > 0 && (
          <div style={styles.grid}>
            {results.map((movie) => (
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
                    <p style={styles.rating}></p>
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
  errorBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    background: "rgba(255,100,100,0.07)",
    border: "1px solid rgba(255,100,100,0.2)",
    borderRadius: 12,
    padding: "20px 24px",
    maxWidth: 480,
    color: "#ff9090",
    fontSize: 14,
    marginBottom: "20px",
  },
  backBtn: {
    background: "none",
    border: "1px solid #ff9090",
    color: "#ff9090",
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
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

export default AiSearchResultsPage;
