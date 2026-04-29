import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const RecommendationsRow = ({
  mostRecentMovieTmdbId,
  watchedMovieTitle,
  mediaType = "movie",
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const rowRef = useRef(null);

  useEffect(() => {
    if (!mostRecentMovieTmdbId) return;

    const fetchRecommendations = async () => {
      setLoading(true);

      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/${mediaType}/${mostRecentMovieTmdbId}/recommendations`,
          {
            params: {
              api_key: TMDB_API_KEY,
              language: "en-US",
              page: 1,
            },
          }
        );

        const mapped = (res.data?.results || []).slice(0, 12).map((item) => ({
          id: item.id,
          tmdbId: item.id,
          title: item.title || item.name,
          poster: item.poster_path
            ? `${TMDB_IMAGE_BASE}${item.poster_path}`
            : null,
        }));

        setRecommendations(mapped);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [mostRecentMovieTmdbId, mediaType]);

  const scrollAmount = 400;

  const scrollLeft = () => {
    rowRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    rowRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleMovieClick = async (item) => {
    try {
      if (mediaType === "tv") {
        console.warn("TV recommendations do not have IMDb movie routes yet.");
        return;
      }

      const externalIdsRes = await axios.get(
        `https://api.themoviedb.org/3/movie/${item.tmdbId}/external_ids`,
        {
          params: { api_key: TMDB_API_KEY },
        }
      );

      const imdbID = externalIdsRes.data?.imdb_id;

      if (imdbID) {
        navigate(`/movies/${imdbID}`);
      } else {
        console.warn("No IMDb ID found for this TMDb movie.");
      }
    } catch (err) {
      console.error("Error converting TMDb ID to IMDb ID:", err);
    }
  };

  if (!mostRecentMovieTmdbId) return null;

  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>Because you watched {watchedMovieTitle}</h2>

      {loading && (
        <p style={{ color: "#aaa", marginBottom: "10px" }}>
          Loading recommendations...
        </p>
      )}

      <div style={styles.carouselWrapper}>
        <button style={styles.arrowButtonLeft} onClick={scrollLeft}>
          ‹
        </button>

        <div ref={rowRef} style={styles.scrollRow}>
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              style={styles.movieCard}
              onClick={() => handleMovieClick(rec)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {rec.poster ? (
                <img src={rec.poster} alt={rec.title} style={styles.poster} />
              ) : (
                <div style={styles.noPoster}>No Image</div>
              )}

              <div style={styles.cardContent}>
                <h4 style={styles.movieTitle}>{rec.title}</h4>
              </div>
            </div>
          ))}
        </div>

        <button style={styles.arrowButtonRight} onClick={scrollRight}>
          ›
        </button>
      </div>
    </div>
  );
};

const styles = {
  section: {
    marginTop: "50px",
  },

  heading: {
    marginBottom: "15px",
    color: "#e0e0e0",
    fontSize: "22px",
    fontWeight: "600",
  },

  carouselWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  scrollRow: {
    display: "flex",
    gap: "18px",
    overflowX: "auto",
    paddingBottom: "12px",
    scrollBehavior: "smooth",
    flex: 1,
    msOverflowStyle: "none",
    scrollbarWidth: "none",
  },

  movieCard: {
    minWidth: "180px",
    maxWidth: "180px",
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    flexShrink: 0,
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  poster: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
  },

  noPoster: {
    width: "100%",
    height: "260px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    color: "#ccc",
  },

  cardContent: {
    padding: "12px",
    textAlign: "center",
  },

  movieTitle: {
    fontSize: "16px",
    marginBottom: "6px",
    color: "#fff",
  },

  arrowButtonLeft: {
    backgroundColor: "rgba(20,20,20,0.85)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "42px",
    height: "42px",
    fontSize: "28px",
    cursor: "pointer",
    marginRight: "12px",
    flexShrink: 0,
  },

  arrowButtonRight: {
    backgroundColor: "rgba(20,20,20,0.85)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "42px",
    height: "42px",
    fontSize: "28px",
    cursor: "pointer",
    marginLeft: "12px",
    flexShrink: 0,
  },
};

export default RecommendationsRow;