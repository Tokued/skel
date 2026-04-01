import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const MoviePage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdded, setIsAdded] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const userId = user?.id;

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

  const toggleWatchlist = async () => {
    if (!userId) {
      alert("You must be logged in");
      return;
    }

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

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:8081/reviews/movie/${id}`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setReviews([]);
    }
  };

  useEffect(() => {
    if (id) fetchReviews();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();

    if (!userId) {
      alert("You must be logged in to submit a review.");
      return;
    }

    if (!rating || !reviewText.trim()) {
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
      fetchReviews();
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert(err.response?.data?.message || "Failed to submit review");
    }
  };

  if (!movie) {
    return <p className="text-white p-6 text-xl">Loading...</p>;
  }

  return (
    <div className="flex justify-center p-10 text-white">
      <div className="max-w-5xl w-full flex flex-col gap-8">
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full flex gap-8">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-64 rounded-lg shadow-md"
          />

          <div className="flex flex-col justify-between flex-1">
            <div>
              <h1 className="text-4xl font-bold mb-3">{movie.title}</h1>
              <p className="text-gray-300 mb-2">
                <strong>Year:</strong> {movie.year}
              </p>
              <p className="text-gray-300 mb-2">
                <strong>Genre:</strong> {movie.genre}
              </p>
              <p className="text-gray-300 mb-2">
                <strong>Runtime:</strong> {movie.runtime}
              </p>
              <p className="text-gray-300 mb-2">
                <strong>Rating:</strong> ⭐ {movie.rating}
              </p>

              <p className="text-gray-200 mt-4 leading-relaxed">
                {movie.plot}
              </p>
            </div>

            <button
              onClick={toggleWatchlist}
              className={`mt-6 px-5 py-3 rounded-md text-white font-semibold transition ${
                isAdded ? "bg-gray-600" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isAdded ? "Added to Watchlist" : "Add to Watchlist"}
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full">
          <h2 className="text-3xl font-bold mb-6">Add a Review</h2>

          <form
            onSubmit={submitReview}
            className="flex flex-col md:flex-row gap-3 mb-8"
          >
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="px-3 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
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
              className="flex-1 px-3 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Submit
            </button>
          </form>

          <h2 className="text-3xl font-bold mb-4">Reviews</h2>

          {reviews.length === 0 ? (
            <p className="text-gray-300">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((r) => (
                <div
                  key={r._id}
                  className="bg-gray-800 p-4 rounded-md border border-gray-700"
                >
                  <p className="mb-2">
                    <strong>User:</strong> {r.userId} |{" "}
                    <strong>Rating:</strong> {"⭐".repeat(r.rating)}
                  </p>
                  <p className="text-gray-200">{r.reviewText}</p>
                  <small className="text-gray-400">
                    Posted on {new Date(r.createdAt).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviePage;