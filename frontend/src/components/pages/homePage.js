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
      <h1 style={styles.title}>Movie Search</h1>

      <div style={styles.searchBar}>
        <button onClick={searchMovies} style={styles.searchButton}>
          Search
        </button>

        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.input}
        />
      </div>

      {searchResults.length > 0 ? (
        <div>
          <h3 style={styles.sectionTitle}>Results</h3>
          <div style={styles.grid}>
            {searchResults.map((movie) => (
              <div
                key={movie.id}
                style={styles.card}
                onClick={() => navigate(`/movies/${movie.id}`)} // ✅ go to movie page
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
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={styles.emptyText}>Search for a movie to see results.</p>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1000px",
    margin: "auto",
    backgroundColor: "#121212",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },

  title: {
    fontSize: "32px",
    marginBottom: "20px",
  },

  sectionTitle: {
    marginTop: "30px",
    marginBottom: "10px",
    color: "#ccc",
  },

  searchBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "none",
    outline: "none",
    color: "black",
    backgroundColor: "#fff",
  },

  searchButton: {
    padding: "10px 15px",
    backgroundColor: "#444",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "15px",
  },

  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: "10px",
    overflow: "hidden",
    transition: "transform 0.2s",
  },

  poster: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
  },

  noPoster: {
    height: "220px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
  },

  cardContent: {
    padding: "10px",
    textAlign: "center",
  },

  movieTitle: {
    fontSize: "14px",
    marginBottom: "5px",
  },

  year: {
    fontSize: "12px",
    color: "#aaa",
  },

  emptyText: {
    color: "#aaa",
    marginTop: "20px",
  },
};

export default HomePage;