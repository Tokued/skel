import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Spinner, Badge } from "react-bootstrap";

const API = "http://localhost:8081/admin";
const OMDB_API = "http://localhost:8081/movies";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingFlagged, setLoadingFlagged] = useState(false);
  const [moviePosters, setMoviePosters] = useState({});
  const [flaggedPosters, setFlaggedPosters] = useState({});

  const accessToken = localStorage.getItem("accessToken");

  const authHeader = useCallback(() => {
    if (!accessToken) return {};
    return { headers: { Authorization: `Bearer ${accessToken}` } };
  }, [accessToken]);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(`${API}/users`, authHeader());
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }, [authHeader]);

  const loadUserReviews = async (userId) => {
    try {
      setLoadingReviews(true);
      setSelectedUser(userId);
      setMoviePosters({});

      const res = await axios.get(
        `${API}/users/${userId}/reviews`,
        authHeader()
      );

      const reviewData = res.data || [];
      setReviews(reviewData);

      // Fetch movie posters for each review
      const posters = {};
      await Promise.all(
        reviewData.map(async (review) => {
          try {
            const movieRes = await axios.get(`${OMDB_API}/${review.movieId}`);
            posters[review.movieId] = movieRes.data.poster;
          } catch (err) {
            console.error(`Failed to fetch poster for ${review.movieId}`);
            posters[review.movieId] = null;
          }
        })
      );

      setMoviePosters(posters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadFlaggedReviews = useCallback(async () => {
    try {
      setLoadingFlagged(true);
      const res = await axios.get(`${API}/reviews/flagged`, authHeader());
      const queue = res.data || [];
      const posters = {};

      const updatedQueue = await Promise.all(
        queue.map(async (review) => {
          try {
            const movieRes = await axios.get(`${OMDB_API}/${review.movieId}`);
            posters[review.movieId] = movieRes.data.poster;
            return {
              ...review,
              movieTitle: movieRes.data.Title || review.movieTitle,
            };
          } catch (err) {
            console.error(`Failed to fetch poster for flagged review ${review.movieId}`);
            posters[review.movieId] = null;
            return review;
          }
        })
      );

      setFlaggedReviews(updatedQueue);
      setFlaggedPosters(posters);
    } catch (err) {
      console.error(err);
      setFlaggedReviews([]);
    } finally {
      setLoadingFlagged(false);
    }
  }, [authHeader]);

  const deleteReview = async (id) => {
    try {
      await axios.delete(`${API}/reviews/${id}`, authHeader());
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setFlaggedReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const unflagReview = async (id) => {
    try {
      await axios.put(`${API}/reviews/${id}/unflag`, {}, authHeader());
      setFlaggedReviews((prev) => prev.filter((r) => r._id !== id));
      if (selectedUser) {
        loadUserReviews(selectedUser);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to unflag review");
    }
  };

  const flagReview = async (id) => {
    try {
      await axios.put(`${API}/reviews/${id}/flag`, {}, authHeader());
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, flagged: true } : r))
      );
      loadFlaggedReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const warnUser = async (userId) => {
    try {
      console.log("Warn user:", userId);
      await axios.put(`${API}/users/${userId}/warn`, {}, authHeader());
      console.log("User warned successfully");
      loadUsers();
    } catch (err) {
      console.error("Warn error:", err);
      alert("Failed to warn user: " + (err.response?.data?.message || err.message));
    }
  };

  const unwarnUser = async (userId) => {
    try {
      console.log("Unwarn user:", userId);
      await axios.put(`${API}/users/${userId}/unwarn`, {}, authHeader());
      console.log("User warning removed");
      loadUsers();
    } catch (err) {
      console.error("Unwarn error:", err);
      alert("Failed to remove warning: " + (err.response?.data?.message || err.message));
    }
  };

  const banUser = async (userId) => {
    try {
      console.log("Ban user:", userId);
      await axios.put(`${API}/users/${userId}/ban`, {}, authHeader());
      console.log("User banned successfully");
      loadUsers();
      if (selectedUser === userId) setSelectedUser(null);
    } catch (err) {
      console.error("Ban error:", err);
      alert("Failed to ban user: " + (err.response?.data?.message || err.message));
    }
  };

  const unbanUser = async (userId) => {
    try {
      console.log("Unban user:", userId);
      await axios.put(`${API}/users/${userId}/unban`, {}, authHeader());
      console.log("User unbanned successfully");
      loadUsers();
    } catch (err) {
      console.error("Unban error:", err);
      alert("Failed to unban user: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    loadUsers();
    loadFlaggedReviews();
  }, [loadUsers, loadFlaggedReviews]);

  const filteredUsers = users.filter((u) =>
    (u.username || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🛠 Admin Dashboard</h1>
        <p style={styles.subtitle}>Manage users and reviews</p>
      </div>

      <input
        type="text"
        placeholder="🔍 Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.searchInput}
      />

      <div style={styles.content}>
        {/* LEFT: USERS PANEL */}
        <div style={styles.usersPanel}>
          <h3 style={styles.panelTitle}>Users</h3>
          {loadingUsers && <Spinner animation="border" size="sm" className="text-light" />}

          <div style={styles.usersList}>
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => loadUserReviews(user._id)}
                style={{
                  ...styles.userCard,
                  ...(selectedUser === user._id && styles.userCardActive),
                }}
              >
                <div style={styles.userCardContent}>
                  <strong style={styles.username}>{user.username || "Unknown"}</strong>
                  {user.isBanned && (
                    <Badge bg="danger" style={{ marginTop: "8px" }}>
                      Banned
                    </Badge>
                  )}
                  {user.warned && (
                    <Badge bg="warning" style={{ marginTop: "8px", marginLeft: "4px" }}>
                      Warned
                    </Badge>
                  )}
                </div>

                <div style={styles.userActions}>
                  {user.warned ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unwarnUser(user._id);
                      }}
                      style={styles.btnUnwarn}
                      title="Remove warning"
                    >
                      ✅
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        warnUser(user._id);
                      }}
                      style={styles.btnWarn}
                      title="Warn user"
                    >
                      ⚠️
                    </button>
                  )}

                  {user.isBanned ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unbanUser(user._id);
                      }}
                      style={styles.btnUnban}
                      title="Unban user"
                    >
                      🔓
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        banUser(user._id);
                      }}
                      style={styles.btnBan}
                      title="Ban user"
                    >
                      🔨
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!loadingUsers && filteredUsers.length === 0 && (
            <p style={styles.emptyText}>No users found</p>
          )}
        </div>

        {/* RIGHT: REVIEWS PANEL */}
        <div style={styles.reviewsPanel}>
          <h3 style={styles.panelTitle}>Reviews</h3>

          {!selectedUser ? (
            <p style={styles.emptyText}>Select a user to view their reviews</p>
          ) : loadingReviews ? (
            <Spinner animation="border" size="sm" className="text-light" />
          ) : reviews.length === 0 ? (
            <p style={styles.emptyText}>No reviews yet</p>
          ) : (
            <div style={styles.reviewsGrid}>
              {reviews.map((review) => (
                <div key={review._id} style={styles.reviewCard}>
                  {/* POSTER */}
                  {moviePosters[review.movieId] && moviePosters[review.movieId] !== "N/A" ? (
                    <img
                      src={moviePosters[review.movieId]}
                      alt={review.movieTitle}
                      style={styles.poster}
                    />
                  ) : (
                    <div style={styles.posterPlaceholder}>No Image</div>
                  )}

                  {/* CONTENT */}
                  <div style={styles.reviewContent}>
                    <h5 style={styles.movieTitle}>{review.movieTitle}</h5>
                    <p style={styles.rating}>⭐ {review.rating}/5</p>
                    <p style={styles.reviewText}>{review.reviewText}</p>

                    {review.flagged && (
                      <Badge bg="warning" style={{ marginBottom: "12px" }}>
                        🚩 Flagged
                      </Badge>
                    )}

                    {/* ACTIONS */}
                    <div style={styles.reviewActions}>
                      <button
                        onClick={() => flagReview(review._id)}
                        style={styles.btnFlag}
                        disabled={review.flagged}
                      >
                        {review.flagged ? "🚩 Flagged" : "🚩 Flag"}
                      </button>
                      <button
                        onClick={() => deleteReview(review._id)}
                        style={styles.btnDelete}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.flaggedSection}>
            <h4 style={styles.sectionTitle}>Flagged Review Queue</h4>

            {loadingFlagged ? (
              <Spinner animation="border" size="sm" className="text-light" />
            ) : flaggedReviews.length === 0 ? (
              <p style={styles.emptyText}>No flagged reviews.</p>
            ) : (
              <div style={styles.reviewsGrid}>
                {flaggedReviews.map((review) => (
                  <div key={review._id} style={styles.reviewCard}>
                    {flaggedPosters[review.movieId] && flaggedPosters[review.movieId] !== "N/A" ? (
                      <img
                        src={flaggedPosters[review.movieId]}
                        alt={review.movieTitle || review.movieId}
                        style={styles.poster}
                      />
                    ) : (
                      <div style={styles.posterPlaceholder}>No Image</div>
                    )}

                    <div style={styles.reviewContent}>
                      <div>
                        <h5 style={styles.movieTitle}>{review.movieTitle || review.movieId}</h5>
                        <p style={styles.rating}>⭐ {review.rating}/5</p>
                        <p style={styles.reviewText}>{review.reviewText}</p>
                        <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                          Reported by: {review.userId?.username || "Unknown"}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => unflagReview(review._id)}
                          style={styles.btnUnwarn}
                        >
                          ✅ Unflag
                        </button>
                        <button
                          onClick={() => deleteReview(review._id)}
                          style={styles.btnDelete}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    padding: "20px",
    color: "white",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "8px",
    background: "linear-gradient(135deg, #cc5c99, #ff69b4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  searchInput: {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "white",
    fontSize: "14px",
    outline: "none",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "20px",
  },
  usersPanel: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    maxHeight: "75vh",
    overflowY: "auto",
  },
  reviewsPanel: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    maxHeight: "75vh",
    overflowY: "auto",
  },
  panelTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "15px",
    color: "#e2e8f0",
  },
  usersList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  userCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "12px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.2s",
  },
  userCardActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#cc5c99",
  },
  userCardContent: {
    flex: 1,
  },
  username: {
    color: "#e2e8f0",
    fontSize: "14px",
  },
  userActions: {
    display: "flex",
    gap: "6px",
  },
  btnWarn: {
    backgroundColor: "transparent",
    border: "1px solid #f59e0b",
    borderRadius: "6px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  btnBan: {
    backgroundColor: "transparent",
    border: "1px solid #ef4444",
    borderRadius: "6px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  btnUnwarn: {
    backgroundColor: "transparent",
    border: "1px solid #10b981",
    borderRadius: "6px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  btnUnban: {
    backgroundColor: "transparent",
    border: "1px solid #10b981",
    borderRadius: "6px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  emptyText: {
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "20px",
  },
  reviewsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  reviewCard: {
    backgroundColor: "#0f172a",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #334155",
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    gap: "12px",
    padding: "12px",
    transition: "all 0.2s",
  },
  poster: {
    width: "100px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "6px",
  },
  posterPlaceholder: {
    width: "100px",
    height: "150px",
    backgroundColor: "#334155",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "12px",
  },
  reviewContent: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  movieTitle: {
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: "bold",
    margin: 0,
  },
  rating: {
    color: "#facc15",
    fontSize: "13px",
    margin: 0,
  },
  reviewText: {
    color: "#cbd5e1",
    fontSize: "13px",
    margin: "6px 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  reviewActions: {
    display: "flex",
    gap: "8px",
  },
  flaggedSection: {
    marginTop: "24px",
    paddingTop: "18px",
    borderTop: "1px solid #334155",
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: "16px",
    marginBottom: "16px",
  },
  btnFlag: {
    backgroundColor: "transparent",
    border: "1px solid #f59e0b",
    color: "#f59e0b",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnDelete: {
    backgroundColor: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};