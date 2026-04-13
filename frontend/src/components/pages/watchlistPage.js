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

  // 🔥 FILTER STATES
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // 🔥 NEW: dropdown toggle
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  // 🔥 FIX: depend on user instead of userId
  useEffect(() => {
    if (!user) return;

    const fetchWatchlist = async () => {
      try {
        const res = await axios.get(`${API}/${user.id}`);
        setWatchlist(res.data);

        const movieDetails = await Promise.all(
          res.data.map((m) =>
            axios.get(`http://localhost:8081/movies/${m.movieId}`)
          )
        );

        setMovies(movieDetails.map((r) => r.data));
      } catch (err) {
        console.error("Failed to fetch watchlist:", err);
      }
    };

    fetchWatchlist();
  }, [user]);

  // 🔥 FIX: normalize IDs
  const getItem = (id) =>
    watchlist.find((m) => String(m.movieId) === String(id));

  const updateState = (movieId, newData) => {
    setWatchlist((prev) =>
      prev.map((m) =>
        String(m.movieId) === String(movieId) ? { ...m, ...newData } : m
      )
    );
  };

  const toggleWatched = async (id) => {
    try {
      const item = getItem(id);
      const res = await axios.put(`${API}/watched/${user.id}/${id}`, {
        watched: !item?.watched,
      });
      updateState(id, res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const setRating = async (id, rating) => {
    const numeric = Number(rating);
    if (numeric < 1 || numeric > 5) return;

    try {
      const res = await axios.put(`${API}/rate/${user.id}/${id}`, {
        rating: numeric,
      });
      updateState(id, res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const item = getItem(id);
      const res = await axios.put(`${API}/favorite/${user.id}/${id}`, {
        favorite: !item?.favorite,
      });
      updateState(id, res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const removeMovie = async (id) => {
    try {
      await axios.delete(`${API}/${user.id}/${id}`);

      // 🔥 FIX: normalize IDs
      setMovies((prev) =>
        prev.filter((m) => String(m.id) !== String(id))
      );
      setWatchlist((prev) =>
        prev.filter((m) => String(m.movieId) !== String(id))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 FILTER LOGIC (FIXED SAFETY)
  const filteredMovies = movies
    .filter((movie) => {
      const item = getItem(movie.id);

      const matchesSearch = movie.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "watched" && !item?.watched) return false;
      if (statusFilter === "unwatched" && item?.watched) return false;
      if (statusFilter === "favorites" && !item?.favorite) return false;

      if (ratingFilter !== "all") {
        const rating = Number(item?.rating);
        const target = Number(ratingFilter);
        if (!rating || rating !== target) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const itemA = getItem(a.id);
      const itemB = getItem(b.id);

      // 🔥 FIX: safe dates
      const dateA = itemA?.addedAt
        ? new Date(itemA.addedAt)
        : new Date(0);
      const dateB = itemB?.addedAt
        ? new Date(itemB.addedAt)
        : new Date(0);

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  if (!user) return <h3>Login required</h3>;

  return (
    <div style={{ padding: 40, background: "#0b0b0b", color: "white", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 25 }}>My Watchlist</h1>

      {/* SEARCH + FILTER BUTTON */}
      <div style={{ display: "flex", gap: 12, marginBottom: 35 }}>
        <input
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputStyle}
        />

        {/* 🔥 NEW: FILTER BUTTON */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={filterBtn}
        >
          ⚙️ Filters
        </button>
      </div>

      {/* 🔥 NEW: DROPDOWN PANEL */}
      {showFilters && (
        <div style={dropdownStyle}>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={dropdownInput}>
            <option value="newest">Recently Added</option>
            <option value="oldest">Oldest First</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={dropdownInput}>
            <option value="all">All</option>
            <option value="watched">Watched</option>
            <option value="unwatched">Unwatched</option>
            <option value="favorites">Favorites</option>
          </select>

          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} style={dropdownInput}>
            <option value="all">Any Rating</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      )}

      <div style={gridStyle}>
        {filteredMovies.map((movie) => {
          const item = getItem(movie.id);
          const isHovered = hovered === movie.id;

          return (
            <div key={movie.id}>
              <div
                onMouseEnter={() => setHovered(movie.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...cardStyle,
                  transform: isHovered ? "scale(1.03)" : "scale(1)",
                }}
              >
                <img
                  src={movie.poster}
                  alt={movie.title} // 🔥 FIX
                  onClick={() => navigate(`/movies/${movie.id}`)}
                  style={imgStyle}
                />

                {item && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 🔥 FIX
                      toggleFavorite(movie.id);
                    }}
                    style={favBtn(item)}
                  >
                    {item?.favorite ? "❤" : "♡"}
                  </button>
                )}

                {isHovered && (
                  <div style={overlayStyle}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatched(movie.id);
                      }}
                      style={overlayBtn}
                    >
                      {item?.watched ? "Unwatch" : "Mark Watched"}
                    </button>

                    {item?.watched && (
                      <select
                        value={item?.rating || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRating(movie.id, e.target.value)}
                        style={overlayBtn}
                      >
                        <option value="">Rate</option>
                        {[1, 2, 3, 4, 5].map((r) => (
                          <option key={r} value={r}>{r} ⭐</option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMovie(movie.id);
                      }}
                      style={{ ...overlayBtn, color: "#ff4d4d" }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div onClick={() => navigate(`/movies/${movie.id}`)} style={{ marginTop: 10, cursor: "pointer" }}>
                <h4>{movie.title}</h4>

                {item?.addedAt && (
                  <div style={{ fontSize: 12, color: "#777" }}>
                    Added: {new Date(item.addedAt).toLocaleDateString()}
                  </div>
                )}

                {item?.rating && (
                  <div style={{ fontSize: 13, color: "#aaa" }}>
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

/* 🔥 STYLES */
const inputStyle = {
  flex: 1,
  padding: 14,
  borderRadius: 10,
  background: "#1a1a1a",
  color: "#aaa",
  border: "1px solid #222",
};

const filterBtn = {
  padding: "14px 18px",
  borderRadius: 10,
  background: "#1a1a1a",
  color: "white",
  border: "1px solid #222",
  cursor: "pointer",
};

const dropdownStyle = {
  display: "flex",
  gap: 12,
  marginBottom: 25,
};

const dropdownInput = {
  padding: 10,
  borderRadius: 8,
  background: "#1a1a1a",
  color: "#aaa",
  border: "1px solid #222",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 30,
};

const cardStyle = {
  background: "#141414",
  borderRadius: 18,
  overflow: "hidden",
  position: "relative",
};

const imgStyle = {
  width: "100%",
  aspectRatio: "2/3",
  objectFit: "cover",
  cursor: "pointer",
};

const overlayStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  background: "rgba(0,0,0,0.85)",
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const overlayBtn = {
  background: "rgba(255,255,255,0.08)",
  border: "none",
  borderRadius: 8,
  padding: 8,
  color: "white",
  cursor: "pointer",
};

const favBtn = (item) => ({
  position: "absolute",
  top: 10,
  right: 10,
  background: "rgba(0,0,0,0.7)",
  border: "none",
  borderRadius: "50%",
  width: 36,
  height: 36,
  color: item?.favorite ? "#ff4d6d" : "white",
  cursor: "pointer",
});

export default WatchlistPage;