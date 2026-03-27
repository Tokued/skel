import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const MoviePage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdded, setIsAdded] = useState(false);

  const userId = user?.id;

  // Get user info
  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  // Fetch movie info
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await axios.get(`http://localhost:8081/movies/${id}`);
        setMovie(res.data);
      } catch (err) {
        console.error("Error fetching movie:", err);
      }
    };

    fetchMovie();
  }, [id]);

  // Check if movie is in watchlist
  useEffect(() => {
    const checkWatchlist = async () => {
      if (!userId || !id) return;

      try {
        const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
        const exists = res.data.some((m) => m.movieId === id);
        setIsAdded(exists);
      } catch (err) {
        console.error("Error checking watchlist:", err);
      }
    };

    checkWatchlist();
  }, [userId, id]);

  // Toggle watchlist
  const toggleWatchlist = async () => {
    if (!userId) return;

    try {
      if (isAdded) {
        // Remove
        await axios.delete(`http://localhost:8081/watchlist/${userId}/${id}`);
        setIsAdded(false);
      } else {
        // Add
        await axios.post("http://localhost:8081/watchlist/add", {
          userId,
          movieId: movie.id,
          title: movie.title,
        });
        setIsAdded(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating watchlist");
    }
  };

  if (!movie) {
    return <p style={{ color: "white", padding: "20px" }}>Loading...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.info}>
          <h1>{movie.title}</h1>
          <p><strong>ID:</strong> {movie.id}</p>

          {/* Toggle button */}
          <button
            onClick={toggleWatchlist}
            style={{
              ...styles.button,
              backgroundColor: isAdded ? "#555" : "#e50914",
              cursor: "pointer",
            }}
          >
            {isAdded ? "Added to Watchlist" : "Add to Watchlist"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  button: {
    marginTop: "20px",
    padding: "10px 15px",
    border: "none",
    color: "white",
    borderRadius: "5px",
  },
};

export default MoviePage;