import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/vmdb-logo.png";

const topMoviesSeed = [
  { id: "tt15398776", title: "Oppenheimer", year: "2023" },
  { id: "tt1517268", title: "Barbie", year: "2023" },
  { id: "tt9362722", title: "Spider-Man: Across the Spider-Verse", year: "2023" },
  { id: "tt0816692", title: "Interstellar", year: "2014" },
  { id: "tt0468569", title: "The Dark Knight", year: "2008" },
];

const HomePage = () => {
  const [topMovies, setTopMovies] = useState(topMoviesSeed);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopMoviePosters = async () => {
      try {
        const results = await Promise.all(
          topMoviesSeed.map(async (movie) => {
            try {
              const res = await axios.get(
                `https://www.omdbapi.com/?apikey=1d0ab4bc&i=${movie.id}`
              );

              return {
                ...movie,
                poster:
                  res.data && res.data.Poster && res.data.Poster !== "N/A"
                    ? res.data.Poster
                    : null,
              };
            } catch {
              return { ...movie, poster: null };
            }
          })
        );

        setTopMovies(results);
      } catch (err) {
        console.error("Error loading top movie posters:", err);
      }
    };

    fetchTopMoviePosters();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <img src={logo} alt="VMDB logo" style={styles.logo} />
        <p style={styles.subtitle}>
          Search movies, explore titles, and manage your watchlist all in one place.
        </p>
      </div>

      <div style={styles.topMoviesSection}>
        <h2 style={styles.sectionTitle}>Top Picks</h2>
        <p style={styles.topMoviesSubtitle}>Popular movies to get you started</p>

        <div style={styles.scrollRow}>
          {topMovies.map((movie) => (
            <div
              key={movie.id}
              style={styles.topMovieCard}
              onClick={() => navigate(`/movies/${movie.id}`)}
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
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1100px",
    margin: "0 auto",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#0f0f0f",
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
  },

  topMoviesSubtitle: {
    color: "#aaa",
    marginBottom: "15px",
  },

  scrollRow: {
    display: "flex",
    gap: "18px",
    overflowX: "auto",
    paddingBottom: "12px",
    scrollbarWidth: "thin",
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
};

export default HomePage;