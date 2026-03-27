import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
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
      setWatchlist((prev) => prev.filter((m) => m.movieId !== id));
    } catch (err) {
      alert("Error removing movie");
    }
  };

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

      {watchlist.length === 0 ? (
        <p style={{ color: "#aaa" }}>No movies added yet.</p>
      ) : (
        <div style={styles.grid}>
          {watchlist.map((movie) => (
            <div
              key={movie.movieId}
              style={styles.card}
              onClick={() => navigate(`/movies/${movie.movieId}`)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <div style={styles.cardContent}>
                <h4 style={styles.movieTitle}>{movie.title}</h4>
                <p style={styles.meta}>
                  Added: {new Date(movie.addedAt).toLocaleDateString()}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMovie(movie.movieId);
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
    cursor: "pointer",
  },
  cardContent: {
    padding: "10px",
    textAlign: "center",
  },
  movieTitle: {
    fontSize: "14px",
    marginBottom: "5px",
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