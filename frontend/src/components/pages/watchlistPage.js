import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const API = "http://localhost:8081/watchlist";

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [hovered, setHovered] = useState(null);

  const navigate = useNavigate();
  const userId = user?.id;

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!userId) return;

      const res = await axios.get(`${API}/${userId}`);
      setWatchlist(res.data);

      const movieDetails = await Promise.all(
        res.data.map((m) => axios.get(`http://localhost:8081/movies/${m.movieId}`))
      );

      setMovies(movieDetails.map((r) => r.data));
    };

    fetchWatchlist();
  }, [userId]);

  const getItem = (id) => watchlist.find((m) => m.movieId === id);

  const updateState = (movieId, newData) => {
    setWatchlist((prev) =>
      prev.map((m) => (m.movieId === movieId ? { ...m, ...newData } : m))
    );
  };

  const toggleWatched = async (id) => {
    const item = getItem(id);
    const res = await axios.put(`${API}/watched/${userId}/${id}`, {
      watched: !item?.watched,
    });
    updateState(id, res.data);
  };

  // ⭐ 5-star rating system
  const setRating = async (id, rating) => {
    const numeric = Number(rating);
    if (numeric < 1 || numeric > 5) return;

    const res = await axios.put(`${API}/rate/${userId}/${id}`, {
      rating: numeric,
    });

    updateState(id, res.data);
  };

  const toggleFavorite = async (id) => {
    const item = getItem(id);
    const res = await axios.put(`${API}/favorite/${userId}/${id}`, {
      favorite: !item?.favorite,
    });
    updateState(id, res.data);
  };

  const removeMovie = async (id) => {
    await axios.delete(`${API}/${userId}/${id}`);
    setMovies((prev) => prev.filter((m) => m.id !== id));
    setWatchlist((prev) => prev.filter((m) => m.movieId !== id));
  };

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) return <h3>Login required</h3>;

  return (
    <div style={{ padding: 40, background: "#0b0b0b", color: "white", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 25 }}>My Watchlist</h1>

      <input
        placeholder="Search movies..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          marginBottom: 35,
          padding: 14,
          width: "100%",
          borderRadius: 10,
          border: "1px solid #222",
          background: "#1a1a1a",
          color: "#aaa",
          outline: "none",
          fontSize: 15,
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 30,
        }}
      >
        {filteredMovies.map((movie) => {
          const item = getItem(movie.id);
          const isHovered = hovered === movie.id;

          return (
            <div key={movie.id}>
              {/* CARD */}
              <div
                onMouseEnter={() => setHovered(movie.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: "#141414",
                  borderRadius: 18,
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: isHovered
                    ? "0 12px 35px rgba(0,0,0,0.9)"
                    : "0 4px 15px rgba(0,0,0,0.5)",
                  transform: isHovered ? "scale(1.03)" : "scale(1)",
                  transition: "all 0.25s ease",
                }}
              >
                {/* Poster */}
                <div style={{ width: "100%", aspectRatio: "2/3", position: "relative" }}>
                  <img
                    src={movie.poster}
                    onClick={() => navigate(`/movies/${movie.id}`)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      cursor: "pointer",
                      display: "block",
                    }}
                  />

                  {/* Favorite */}
                  {item?.watched && (
                    <button
                      onClick={() => toggleFavorite(movie.id)}
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: "rgba(0,0,0,0.7)",
                        border: "none",
                        borderRadius: "50%",
                        width: 36,
                        height: 36,
                        color: item?.favorite ? "#ff4d6d" : "white",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      {item?.favorite ? "❤" : "♡"}
                    </button>
                  )}

                  {/* Overlay */}
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.85)",
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <button onClick={() => toggleWatched(movie.id)} style={overlayBtn}>
                        {item?.watched ? "Unwatch" : "Mark Watched"}
                      </button>

                      {/* 5-star rating */}
                      {item?.watched && (
                        <select
                          value={item?.rating || ""}
                          onChange={(e) => setRating(movie.id, e.target.value)}
                          style={overlayBtn}
                        >
                          <option value="">Rate (1-5)</option>
                          {[1, 2, 3, 4, 5].map((r) => (
                            <option key={r} value={r}>
                              {r} ⭐
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={() => removeMovie(movie.id)}
                        style={{ ...overlayBtn, color: "#ff4d4d" }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title + Rating */}
              <div
                onClick={() => navigate(`/movies/${movie.id}`)}
                style={{ marginTop: 10, padding: "0 4px", cursor: "pointer" }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: 15,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {movie.title}
                </h4>

                {item?.rating && (
                  <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>
                    Rated: {item.rating}/5 ⭐
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const overlayBtn = {
  background: "rgba(255,255,255,0.08)",
  border: "none",
  borderRadius: 8,
  padding: "8px",
  color: "white",
  cursor: "pointer",
  fontSize: 13,
};

export default WatchlistPage;