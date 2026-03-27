import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Get user info
  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  const userId = user?.id;

  // Fetch watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
        setWatchlist(res.data);
      } catch (err) {
        console.error("Error fetching watchlist:", err);
      }
    };

    if (userId) fetchWatchlist();
  }, [userId]);

  // Search movies (OMDb via backend)
  const searchMovies = async () => {
    if (!searchQuery) return;

    try {
      const res = await axios.get(
        `http://localhost:8081/movies/search?query=${searchQuery}`
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Add movie directly
  const addMovie = async (movie) => {
    if (!movie) return;

    try {
      await axios.post(`http://localhost:8081/watchlist/add`, {
        userId,
        movieId: movie.id,
        title: movie.title,
      });

      setSearchResults([]); // clear search results
      const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
      setWatchlist(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error adding movie");
    }
  };

  // Remove movie
  const removeMovie = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/watchlist/${userId}/${id}`);
      const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
      setWatchlist(res.data);
    } catch (err) {
      alert("Error removing movie");
    }
  };

  // Auto search while typing
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery) searchMovies();
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  if (!userId) {
    return (
      <div style={{ padding: "20px" }}>
        <h4>Log in to view this page.</h4>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Watchlist</h1>

      {/* SEARCH BAR */}
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

      {/* SEARCH RESULTS */}
      {searchResults.length > 0 && (
        <div>
          <h3 style={styles.sectionTitle}>Results</h3>
          <div style={styles.grid}>
            {searchResults.map((movie) => (
              <div
                key={movie.id}
                style={styles.card}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {movie.poster !== "N/A" ? (
                  <img src={movie.poster} alt="" style={styles.poster} />
                ) : (
                  <div style={styles.noPoster}>No Image</div>
                )}

                <div style={styles.cardContent}>
                  <h4 style={styles.movieTitle}>{movie.title}</h4>
                  <p style={styles.year}>{movie.year}</p>

                  {/* Single button: Add movie */}
                  <button
                    onClick={() => addMovie(movie)}
                    style={styles.addButton}
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WATCHLIST */}
      <h3 style={styles.sectionTitle}>Your Watchlist</h3>

      {watchlist.length === 0 ? (
        <p style={{ color: "#aaa" }}>No movies added yet.</p>
      ) : (
        <div style={styles.grid}>
          {watchlist.map((movie) => (
            <div
              key={movie.movieId}
              style={styles.card}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={styles.cardContent}>
                <h4 style={styles.movieTitle}>{movie.title}</h4>
                <p style={styles.meta}>
                  Added: {new Date(movie.addedAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => removeMovie(movie.movieId)}
                  style={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
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
    color: "black",            // <-- text color
    backgroundColor: "#fff",   // <-- white background for contrast
  },

  searchButton: {
    padding: "10px 15px",
    backgroundColor: "#444",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  addButton: {
    marginTop: "10px",
    padding: "5px 10px",
    backgroundColor: "#e50914",
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

  meta: {
    fontSize: "12px",
    color: "#aaa",
    marginBottom: "10px",
  },

  removeButton: {
    marginTop: "10px",
    padding: "5px 10px",
    backgroundColor: "red",
    border: "none",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default WatchlistPage;