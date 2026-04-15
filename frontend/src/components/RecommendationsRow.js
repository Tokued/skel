import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const RecommendationsRow = ({ mostRecentMovieTmdbId, watchedMovieTitle, mediaType = "movie" }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const rowRef = useRef(null);

  useEffect(() => {
    if (!mostRecentMovieTmdbId) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // Use /recommendations for TV shows, /similar for movies
        const endpoint = mediaType === "tv" ? "recommendations" : "similar";
        
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

        const mappedMovies = await Promise.all(
          (res.data?.results || []).slice(0, 20).map(async (item) => {
            try {
              const externalIdsRes = await axios.get(
                `https://api.themoviedb.org/3/${mediaType}/${item.id}/external_ids?api_key=${TMDB_API_KEY}`
              );

              return {
                id: externalIdsRes.data?.imdb_id || `${mediaType}-${item.id}`,
                tmdbId: item.id,
                title: item.title || item.name,
                year: mediaType === "movie"
                  ? item.release_date
                    ? item.release_date.slice(0, 4)
                    : "N/A"
                  : item.first_air_date
                  ? item.first_air_date.slice(0, 4)
                  : "N/A",
                poster: item.poster_path
                  ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                  : null,
                hasOmdbRoute: !!externalIdsRes.data?.imdb_id,
              };
            } catch {
              return {
                id: `${mediaType}-${item.id}`,
                tmdbId: item.id,
                title: item.title || item.name,
                year: mediaType === "movie"
                  ? item.release_date
                    ? item.release_date.slice(0, 4)
                    : "N/A"
                  : item.first_air_date
                  ? item.first_air_date.slice(0, 4)
                  : "N/A",
                poster: item.poster_path
                  ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                  : null,
                hasOmdbRoute: false,
              };
            }
          })
        );

        setRecommendations(mappedMovies);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [mostRecentMovieTmdbId, mediaType]);

  const scrollAmount = 396;

  const scrollLeft = () => {
    const row = rowRef.current;
    if (!row) return;

    if (row.scrollLeft <= 10) {
      row.scrollTo({
        left: row.scrollWidth - row.clientWidth,
        behavior: "smooth",
      });
    } else {
      row.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const row = rowRef.current;
    if (!row) return;

    const maxScrollLeft = row.scrollWidth - row.clientWidth;

    if (row.scrollLeft >= maxScrollLeft - 10) {
      row.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      row.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleMovieClick = (item) => {
    if (item.hasOmdbRoute) {
      navigate(`/movies/${item.id}`);
    } else {
      console.warn("No IMDb ID found for this item yet.");
    }
  };

  if (!mostRecentMovieTmdbId || recommendations.length === 0) return null;

  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>Because you watched {watchedMovieTitle}</h2>

      <div style={styles.carouselWrapper}>
        <button style={styles.arrowButtonLeft} onClick={scrollLeft}>
          ‹
        </button>

        <div
          ref={rowRef}
          style={styles.scrollRow}
          className="hide-scrollbar"
        >
          {recommendations.map((item) => (
            <div
              key={item.id}
              style={styles.movieCard}
              onClick={() => handleMovieClick(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
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
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
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
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    flex: 1,
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
    marginBottom: "8px",
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