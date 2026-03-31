import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const searchMovies = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:8081/movies/search?query=${searchQuery}`
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.trim()) {
        searchMovies();
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>VMDB</h1>
        <p style={styles.subtitle}>
          Search movies, explore titles, and manage your watchlist all in one place.
        </p>
      </div>

      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search for a movie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.input}
        />
        <button onClick={searchMovies} style={styles.searchButton}>
          Search
        </button>
      </div>

      {searchResults.length > 0 ? (
        <div>
          <h3 style={styles.sectionTitle}>Search Results</h3>
          <div style={styles.grid}>
            {searchResults.map((movie) => (
              <div
                key={movie.id}
                style={styles.card}
                onClick={() => navigate(`/movies/${movie.id}`)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                {movie.poster !== "N/A" ? (
                  <img src={movie.poster} alt={movie.title} style={styles.poster} />
                ) : (
                  <div style={styles.noPoster}>No Image</div>
                )}

                <div style={styles.cardContent}>
                  <h4 style={styles.movieTitle}>{movie.title}</h4>
                  <p style={styles.year}>{movie.year}</p>
                  <p style={styles.viewText}>Click to view details</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <h3>Find your next movie</h3>
          <p>Search for a title like Batman, Interstellar, or Spider-Man.</p>
        </div>
      )}
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
    marginBottom: "30px",
    textAlign: "center",
    padding: "30px 20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
  },

  title: {
    fontSize: "48px",
    marginBottom: "10px",
    color: "#FFA500",
  },

  subtitle: {
    fontSize: "18px",
    color: "#cfcfcf",
    maxWidth: "700px",
    margin: "0 auto",
  },

  searchBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
  },

  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    outline: "none",
    fontSize: "16px",
    backgroundColor: "#1f1f1f",
    color: "white",
  },

  searchButton: {
    padding: "12px 18px",
    backgroundColor: "#2f2f2f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  sectionTitle: {
    marginBottom: "15px",
    color: "#e0e0e0",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    overflow: "hidden",
    transition: "transform 0.2s",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
  },

  poster: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
  },

  noPoster: {
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

  viewText: {
    fontSize: "12px",
    color: "#888",
  },

  emptyState: {
    textAlign: "center",
    marginTop: "50px",
    color: "#bbb",
    backgroundColor: "#1a1a1a",
    padding: "30px",
    borderRadius: "16px",
  },
};

export default HomePage;