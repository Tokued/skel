import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const userId = user?.id;

  // Get user info
  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  // Fetch watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
        setWatchlist(res.data);

        // Fetch full movie details for posters
        const movieDetailsPromises = res.data.map((movie) =>
          axios.get(`http://localhost:8081/movies/${movie.movieId}`)
        );
        const moviesRes = await Promise.all(movieDetailsPromises);
        setMovies(moviesRes.map((r) => r.data));
      } catch (err) {
        console.error("Error fetching watchlist:", err);
      }
    };

    fetchWatchlist();
  }, [userId]);

  // Remove movie
  const removeMovie = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/watchlist/${userId}/${id}`);
      setMovies((prev) => prev.filter((m) => m.id !== id));
      setWatchlist((prev) => prev.filter((m) => m.movieId !== id));
    } catch (err) {
      alert("Error removing movie");
    }
  };

  // Filter movies based on search query
  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <input
          type="text"
          placeholder="Search your watchlist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.input}
        />
      </div>

      {filteredMovies.length === 0 ? (
        <p style={{ color: "#aaa", textAlign: "center", marginTop: "50px" }}>
          {searchQuery ? "No results found." : "Your watchlist is empty."}
        </p>
      ) : (
        <div style={styles.grid}>
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              style={styles.card}
              onClick={() => navigate(`/movies/${movie.id}`)}
            >
              {movie.poster && movie.poster !== "N/A" ? (
                <img src={movie.poster} alt={movie.title} style={styles.poster} />
              ) : (
                <div style={styles.noPoster}>No Image</div>
              )}

              <div className="overlay" style={styles.overlay}>
                <h4 style={styles.movieTitle}>{movie.title}</h4>
                <p style={styles.meta}>
                  Added:{" "}
                  {new Date(
                    watchlist.find((m) => m.movieId === movie.id)?.addedAt
                  ).toLocaleDateString()}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMovie(movie.id);
                  }}
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
    padding: "40px",
    backgroundColor: "#121212",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "36px",
    marginBottom: "30px",
    textAlign: "center",
  },
  searchBar: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  input: {
    width: "50%",
    padding: "10px 15px",
    borderRadius: "5px",
    border: "none",
    outline: "none",
    fontSize: "16px",
    color: "#333",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "20px",
  },
  card: {
    position: "relative",
    borderRadius: "10px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.3s, box-shadow 0.3s",
  },
  poster: {
    width: "100%",
    height: "270px",
    objectFit: "cover",
    display: "block",
  },
  noPoster: {
    width: "100%",
    height: "270px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    color: "#aaa",
    fontSize: "14px",
  },
  overlay: {
    position: "absolute",
    bottom: "0",
    width: "100%",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    padding: "10px",
    textAlign: "center",
    opacity: "0",
    transition: "opacity 0.3s",
  },
  movieTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    margin: "5px 0",
  },
  meta: {
    fontSize: "12px",
    color: "#ccc",
    marginBottom: "8px",
  },
  removeButton: {
    padding: "5px 10px",
    backgroundColor: "#e50914",
    border: "none",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
  },
};

// Inject hover CSS
const styleSheet = `
  .overlay:hover {
    opacity: 1 !important;
  }
  div[style*='position: relative']:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 10px 20px rgba(0,0,0,0.7) !important;
  }
`;
document.head.appendChild(Object.assign(document.createElement("style"), { textContent: styleSheet }));

export default WatchlistPage;