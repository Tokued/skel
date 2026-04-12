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

  // filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("none");

  // ✅ NEW dropdown toggle
  const [showFilters, setShowFilters] = useState(false);

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
        res.data.map((m) =>
          axios.get(`http://localhost:8081/movies/${m.movieId}`)
        )
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

  // filter
  let filteredMovies = movies.filter((movie) => {
    const item = getItem(movie.id);

    const matchesSearch = movie.title
      .toLowerCase()
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
  });

  // sort
  if (sortOrder === "newest") {
    filteredMovies.sort(
      (a, b) =>
        new Date(getItem(b.id)?.addedAt) -
        new Date(getItem(a.id)?.addedAt)
    );
  } else if (sortOrder === "oldest") {
    filteredMovies.sort(
      (a, b) =>
        new Date(getItem(a.id)?.addedAt) -
        new Date(getItem(b.id)?.addedAt)
    );
  }

  if (!userId) return <h3>Login required</h3>;

  return (
    <div style={{ padding: 40, background: "#0b0b0b", color: "white", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 25 }}>My Watchlist</h1>

      {/* SEARCH + FILTER BUTTON */}
      <div style={{ display: "flex", gap: 12, marginBottom: 35, position: "relative" }}>
        <input
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchStyle}
        />

        {/* ✅ FILTER BUTTON */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={filterBtn}
        >
          ☰ Filters
        </button>

        {/* ✅ DROPDOWN PANEL */}
        {showFilters && (
          <div style={dropdownStyle}>
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="all">All</option>
              <option value="watched">Watched</option>
              <option value="unwatched">Unwatched</option>
              <option value="favorites">Favorites</option>
            </select>

            <label>Rating</label>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} style={selectStyle}>
              <option value="all">Any</option>
              {[5,4,3,2,1].map(r => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>

            <label>Sort</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={selectStyle}>
              <option value="none">None</option>
              <option value="newest">Recently Added</option>
              <option value="oldest">Oldest Added</option>
            </select>
          </div>
        )}
      </div>

      {/* MOVIES GRID */}
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
                <img
                  src={movie.poster}
                  onClick={() => navigate(`/movies/${movie.id}`)}
                  style={posterStyle}
                />
              </div>

              <div onClick={() => navigate(`/movies/${movie.id}`)} style={{ marginTop: 10, cursor: "pointer" }}>
                <h4 style={{ margin: 0 }}>{movie.title}</h4>

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

// styles
const searchStyle = {
  flex: 1,
  padding: 14,
  borderRadius: 10,
  border: "1px solid #222",
  background: "#1a1a1a",
  color: "#aaa",
};

const filterBtn = {
  padding: "12px 16px",
  borderRadius: 10,
  background: "#1a1a1a",
  color: "white",
  border: "1px solid #222",
  cursor: "pointer",
};

const dropdownStyle = {
  position: "absolute",
  top: 60,
  right: 0,
  background: "#141414",
  padding: 15,
  borderRadius: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  width: 200,
  boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
  zIndex: 10,
};

const selectStyle = {
  padding: 8,
  borderRadius: 6,
  background: "#1a1a1a",
  color: "#aaa",
  border: "1px solid #222",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 30,
};

const posterStyle = {
  width: "100%",
  aspectRatio: "2/3",
  objectFit: "cover",
  cursor: "pointer",
};

export default WatchlistPage;