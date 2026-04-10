import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";
import MovieTrailer from "../MovieTrailer";

const MoviePage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdded, setIsAdded] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // ✨ EDIT MODAL STATE
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState("");

  const userId = user?.id || user?._id;

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

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

  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:8081/reviews/movie/${id}`
      );
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const toggleWatchlist = async () => {
    if (!userId) return alert("You must be logged in");

    try {
      if (isAdded) {
        await axios.delete(
          `http://localhost:8081/watchlist/${userId}/${id}`
        );
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

  // ⭐ STAR CLICK HANDLER
  const StarSelector = ({ value, setValue }) => {
    return (
      <div style={{ fontSize: "22px", cursor: "pointer" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            onClick={() => setValue(n)}
            style={{ color: n <= value ? "#f5c518" : "#555" }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!userId) return alert("Login required");

    try {
      await axios.post("http://localhost:8081/reviews/add", {
        movieId: id,
        userId,
        rating,
        reviewText,
      });

      setRating(0);
      setReviewText("");
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting review");
    }
  };

  // ✏️ OPEN EDIT MODAL
  const openEdit = (r) => {
    setEditingReview(r);
    setEditRating(r.rating);
    setEditText(r.reviewText);
  };

  // 💾 SAVE EDIT
  const saveEdit = async () => {
    try {
      await axios.put(`http://localhost:8081/reviews/${editingReview._id}`, {
        userId,
        rating: editRating,
        reviewText: editText,
      });

      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      alert("Failed to update review");
    }
  };

  // 🗑 DELETE
  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;

    try {
      await axios.delete(`http://localhost:8081/reviews/${id}`, {
        data: { userId },
      });

      fetchReviews();
    } catch (err) {
      alert("Failed to delete review");
    }
  };

  if (!movie) return <p className="text-white p-6">Loading...</p>;

  return (
    <div className="flex justify-center p-10 text-white">
      <div className="max-w-5xl w-full flex flex-col gap-8">

        {/* MOVIE INFO */}
        <div className="bg-gray-900 p-8 rounded-lg">
          <h1 className="text-4xl font-bold text-center mb-8">{movie.title}</h1>

        <div className="flex gap-8 items-stretch flex-wrap lg:flex-nowrap">
          <div className="w-64 flex-shrink-0">
            <img
            src={movie.poster}
            alt={movie.title}
            className="w-64 h-[384px] object-cover rounded-lg"
          />
        </div>

    <div className="flex-1 min-w-[300px] rounded-xl overflow-hidden border border-gray-700 shadow-2xl shadow-black/60 bg-black">
      <MovieTrailer imdbID={movie.id} title={movie.title} />
    </div>
  </div>

  <div className="mt-8">
    <p className="text-lg leading-8">{movie.plot}</p>

    <div className="flex justify-center">
      <button
        onClick={toggleWatchlist}
        className="mt-6 px-6 py-3 bg-red-600 rounded text-lg hover:bg-red-800 hover:scale-105 transition duration-200"
>
        {isAdded ? "Added" : "Add to Watchlist"}
      </button>
    </div>
  </div>
</div>

        {/* ADD REVIEW */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-2xl mb-3">Add Review</h2>

          <StarSelector value={rating} setValue={setRating} />

          <input
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full mt-3 p-2 bg-gray-800 rounded"
            placeholder="Write review..."
          />

          <button
            onClick={submitReview}
            className="mt-3 bg-red-600 px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>

        {/* REVIEWS */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-2xl mb-4">Reviews</h2>

          {reviews.map((r) => (
            <div key={r._id} className="bg-gray-800 p-4 rounded mb-3">
              <div className="flex justify-between">
                <strong>{r.userId?.username || "User"}</strong>

                <div>
                  {"⭐".repeat(r.rating)}
                </div>
              </div>

              <p className="mt-2">{r.reviewText}</p>

              <small className="text-gray-400">
                {new Date(r.createdAt).toLocaleString()}
                {r.updatedAt && r.updatedAt !== r.createdAt && (
                  <span> • edited</span>
                )}
              </small>

              {r.userId?._id === userId && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => openEdit(r)}
                    className="bg-blue-600 px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteReview(r._id)}
                    className="bg-red-600 px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ✨ EDIT MODAL */}
      {editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded w-96">
            <h2 className="text-xl mb-3">Edit Review</h2>

            <StarSelector value={editRating} setValue={setEditRating} />

            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full mt-3 p-2 bg-gray-800 rounded"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingReview(null)}
                className="bg-gray-600 px-3 py-1 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="bg-green-600 px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePage;