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
        const endpoint =
          mediaType === "tv" ? "recommendations" : "similar";

        const res = await axios.get(
          `https://api.themoviedb.org/3/${mediaType}/${mostRecentMovieTmdbId}/${endpoint}`,
          {
            params: {
              api_key: TMDB_API_KEY,
              language: "en-US",
              page: 1,
            },
          }
        );

        const mapped = (res.data?.results || [])
          .slice(0, 20)
          .map((item) => ({
            id: item.id,
            tmdbId: item.id,
            title: item.title || item.name,
            year:
              mediaType === "movie"
                ? item.release_date?.slice(0, 4) || "N/A"
                : item.first_air_date?.slice(0, 4) || "N/A",
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

  // simple + stable scrolling (no edge bugs)
  const scrollAmount = 400;

  const scrollLeft = () => {
    rowRef.current?.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    rowRef.current?.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const handleMovieClick = (item) => {
    navigate(`/movies/${item.tmdbId}`);
  };

  if (!mostRecentMovieTmdbId) return null;

  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>
        Because you watched {watchedMovieTitle}
      </h2>

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
          {recommendations.map((item) => (
            <div
              key={item.id}
              style={styles.movieCard}
              onClick={() => handleMovieClick(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  style={styles.poster}
                />
              ) : (
                <div style={styles.noPoster}>No Image</div>
              )}

              <div style={styles.cardContent}>
                <h4 style={styles.movieTitle}>{item.title}</h4>
                <p style={styles.year}>{item.year}</p>
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

  year: {
    fontSize: "13px",
    color: "#aaa",
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