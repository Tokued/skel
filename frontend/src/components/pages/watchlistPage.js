import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [movieTitle, setMovieTitle] = useState("");
  const [movieId, setMovieId] = useState("");
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

  // Fetch watchlist when userId changes
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
        setWatchlist(res.data);
      } catch (err) {
        console.error("Error fetching watchlist:", err);
      }
    };

    if (userId) {
      fetchWatchlist();
    }
  }, [userId]);

  if (!userId) {
    return (
      <div style={{ padding: "20px" }}>
        <h4>Log in to view this page.</h4>
      </div>
    );
  }

  const { username, email } = user;

  const addMovie = async () => {
    if (!movieId || !movieTitle) {
      alert("Enter both Movie ID and Title");
      return;
    }

    try {
      await axios.post(`http://localhost:8081/watchlist/add`, {
        userId,
        movieId,
        title: movieTitle,
      });
      setMovieId("");
      setMovieTitle("");
      // Refresh list
      const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
      setWatchlist(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error adding movie");
    }
  };

  const removeMovie = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/watchlist/${userId}/${id}`);
      const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
      setWatchlist(res.data);
    } catch (err) {
      alert("Error removing movie");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>

      <h1>My Watchlist</h1>

      {/* Add Movie Form */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Movie ID"
          value={movieId}
          onChange={(e) => setMovieId(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Movie Title"
          value={movieTitle}
          onChange={(e) => setMovieTitle(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button onClick={addMovie} style={{ padding: "5px 10px" }}>
          Add
        </button>
      </div>

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <p>Your watchlist is empty.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {watchlist.map((movie) => (
            <li
              key={movie.movieId}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{movie.title}</strong> (ID: {movie.movieId})
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Added: {new Date(movie.addedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => removeMovie(movie.movieId)}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  cursor: "pointer",
                  borderRadius: "3px",
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WatchlistPage;