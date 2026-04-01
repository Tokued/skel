import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const MoviePage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdded, setIsAdded] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

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
        await axios.delete(`http://localhost:8081/watchlist/${userId}/${id}`);
        setIsAdded(false);
      } else {
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

  // Fetch reviews for this movie
  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:8081/reviews/movie/${id}`);
      setReviews(res.data.reviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    if (id) fetchReviews();
  }, [id]);

  // Submit a review
  const submitReview = async (e) => {
    e.preventDefault();

    if (!userId) {
      alert("You must be logged in to submit a review.");
      return;
    }

    if (!rating || !reviewText) {
      alert("Please select a rating and enter your review text.");
      return;
    }

    try {
      await axios.post("http://localhost:8081/reviews/add", {
        movieId: id,
        userId,
        rating: Number(rating),
        reviewText,
      });
      setRating(0);
      setReviewText("");
      fetchReviews(); // Refresh list
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert(err.response?.data?.message || "Failed to submit review");
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

          {/* Watchlist button */}
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

          {/* Review Form */}
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ color: "white" }}>Add a Review</h3>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={styles.input}
              >
                <option value={0}>Select Rating</option>
                <option value={1}>⭐ 1</option>
                <option value={2}>⭐⭐ 2</option>
                <option value={3}>⭐⭐⭐ 3</option>
                <option value={4}>⭐⭐⭐⭐ 4</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5</option>
              </select>
              <input
                type="text"
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={styles.input}
              />
              <button onClick={submitReview} style={styles.submitButton}>
                Submit
              </button>
            </div>
          </div>

          {/* Reviews List */}
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ color: "white" }}>Reviews</h3>
            {reviews.length === 0 && <p style={{ color: "white" }}>No reviews yet.</p>}
            {reviews.map((r) => (
              <div key={r._id} style={styles.reviewCard}>
                <p>
                  <strong>User:</strong> {r.userId} | <strong>Rating:</strong>{" "}
                  {"⭐".repeat(r.rating)}
                </p>
                <p>{r.reviewText}</p>
                <small style={{ color: "#aaa" }}>
                  Posted on {new Date(r.createdAt).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "20px" },
  card: { backgroundColor: "#222", padding: "20px", borderRadius: "10px" },
  info: { color: "white" },
  button: {
    marginTop: "20px",
    padding: "10px 15px",
    border: "none",
    color: "white",
    borderRadius: "5px",
  },
  input: {
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "white",
  },
  submitButton: {
    padding: "8px 12px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#e50914",
    color: "white",
    cursor: "pointer",
  },
  reviewCard: {
    backgroundColor: "#333",
    padding: "10px",
    borderRadius: "5px",
    marginTop: "10px",
  },
};

export default MoviePage;