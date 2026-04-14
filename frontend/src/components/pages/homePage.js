import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/vmdb-logo.png";
import TrailerRow from "../TrailerRow";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_POSTER_BG_BASE = "https://image.tmdb.org/t/p/original";



const HomePage = () => {
  const [bgPosters, setBgPosters] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const navigate = useNavigate();
  const rowRef = useRef(null);

  useEffect(() => {
    const fetchHomePageData = async () => {
      try {
        const trendingRes = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`
        );

const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

const discoverRequests = years.map((year) =>
  axios.get(`https://api.themoviedb.org/3/discover/movie`, {
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
  .slice(0, 40)
  .map((m) => `${TMDB_POSTER_BG_BASE}${m.poster_path}`);

setBgPosters(posters);

        const movies = trendingRes.data?.results?.slice(0, 20) || [];

        const mappedMovies = await Promise.all(
          movies.map(async (movie) => {
            try {
              const externalIdsRes = await axios.get(
                `https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${TMDB_API_KEY}`
              );

              const imdbID = externalIdsRes.data?.imdb_id;

              return {
                id: imdbID || `tmdb-${movie.id}`,
                tmdbId: movie.id,
                title: movie.title,
                year: movie.release_date
                  ? movie.release_date.slice(0, 4)
                  : "N/A",
                poster: movie.poster_path
                  ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
                  : null,
                hasOmdbRoute: !!imdbID,
              };
            } catch {
              return {
                id: `tmdb-${movie.id}`,
                tmdbId: movie.id,
                title: movie.title,
                year: movie.release_date
                  ? movie.release_date.slice(0, 4)
                  : "N/A",
                poster: movie.poster_path
                  ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
                  : null,
                hasOmdbRoute: false,
              };
            }
          })
        );

        setTopMovies(mappedMovies);
      } catch (err) {
        console.error("Error loading homepage data:", err);
      }
    };

    fetchHomePageData();
  }, []);

  useEffect(() => {
    if (bgPosters.length === 0) return;

    const interval = setInterval(() => {
      setBgPosters((prev) => {
        const shuffled = [...prev].sort(() => 0.5 - Math.random());
        return shuffled;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [bgPosters.length]);

  const handleMovieClick = (movie) => {
    if (movie.hasOmdbRoute) {
      navigate(`/movies/${movie.id}`);
    } else {
      console.warn("No IMDb ID found for this TMDb movie yet.");
    }
  };

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

  return (
    <div style={styles.container}>
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

      <div style={styles.pageContent}>
        <div style={styles.hero}>
          <img src={logo} alt="VMDB logo" style={styles.logo} />
          <p style={styles.subtitle}>
            Search movies, explore titles, and manage your watchlist all in one
            place.
          </p>
        </div>

        <div style={styles.topMoviesSection}>
          <h2 style={styles.sectionTitle}>Trending Now</h2>
          <p style={styles.topMoviesSubtitle}>
            Updated from TMDb trending movies
          </p>

          <div style={styles.carouselWrapper}>
            <button style={styles.arrowButtonLeft} onClick={scrollLeft}>
              ‹
            </button>

            <div
              ref={rowRef}
              style={styles.scrollRow}
              className="hide-scrollbar"
            >
              {topMovies.map((movie) => (
                <div
                  key={movie.id}
                  style={styles.topMovieCard}
                  onClick={() => handleMovieClick(movie)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      style={styles.topMoviePoster}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div style={styles.noTopPoster}>No Image</div>
                  )}

                  <div style={styles.cardContent}>
                    <h4 style={styles.movieTitle}>{movie.title}</h4>
                    <p style={styles.year}>{movie.year}</p>
                  </div>
                </div>
              ))}
            </div>

            <button style={styles.arrowButtonRight} onClick={scrollRight}>
              ›
            </button>
          </div>
        </div>

        <TrailerRow />
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    padding: "30px",
    maxWidth: "1100px",
    margin: "0 auto",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#0f0f0f",
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
  filter: "brightness(0.45)",
  transition: "background-image 0.8s ease-in-out",
},

  posterOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.68)",
    zIndex: 1,
    pointerEvents: "none",
  },

  pageContent: {
    position: "relative",
    zIndex: 2,
  },

  hero: {
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "10px 0",
  },

  logo: {
    width: "160px",
    height: "auto",
    marginBottom: "10px",
    filter: "drop-shadow(0 6px 15px rgba(0,0,0,0.7))",
  },

  subtitle: {
    fontSize: "15px",
    color: "#bdbdbd",
    maxWidth: "450px",
    textAlign: "center",
    lineHeight: "1.4",
    margin: 0,
  },

  sectionTitle: {
    marginBottom: "15px",
    color: "#e0e0e0",
  },

  noTopPoster: {
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

  topMoviesSection: {
    marginTop: "50px",
    position: "relative",
  },

  topMoviesSubtitle: {
    color: "#aaa",
    marginBottom: "15px",
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

  topMovieCard: {
    minWidth: "180px",
    maxWidth: "180px",
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    flexShrink: 0,
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  topMoviePoster: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
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

export default HomePage;