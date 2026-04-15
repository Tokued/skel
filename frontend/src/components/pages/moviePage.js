import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";
import MovieTrailer from "../MovieTrailer";

const MoviePage = () => {
  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movieError, setMovieError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [watchlist, setWatchlist] = useState([]);

  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState("");

  const userId = user?.id || user?._id;

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setMovieError("");
      setMovie(null);

      try {
        const res = await axios.get(`http://localhost:8081/movies/${id}`);
        const baseMovie = res.data;

        let mergedMovie = { ...baseMovie, tmdbPoster: null };

        try {
          let tmdbMovie = null;

          const findRes = await axios.get(
            `https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
          );

          tmdbMovie = findRes.data?.movie_results?.[0] || null;

          if (!tmdbMovie && baseMovie?.title) {
            const searchRes = await axios.get(
              `https://api.themoviedb.org/3/search/movie`,
              {
                params: {
                  api_key: TMDB_API_KEY,
                  query: baseMovie.title,
                  language: "en-US",
                  page: 1,
                },
              }
            );

            tmdbMovie = searchRes.data?.results?.[0] || null;
          }

          if (tmdbMovie) {
            const detailsRes = await axios.get(
              `https://api.themoviedb.org/3/movie/${tmdbMovie.id}?api_key=${TMDB_API_KEY}`
            );

            const tmdbDetails = detailsRes.data;
            const tmdbPosterUrl = tmdbDetails?.poster_path
              ? `${TMDB_IMAGE_BASE}${tmdbDetails.poster_path}`
              : null;

            const missingPoster = !baseMovie?.poster || baseMovie.poster === "N/A";
            const missingPlot = !baseMovie?.plot || baseMovie.plot === "N/A";

            mergedMovie = {
              ...baseMovie,
              title: baseMovie?.title || tmdbDetails?.title || "N/A",
              poster: !missingPoster ? baseMovie.poster : tmdbPosterUrl,
              tmdbPoster: tmdbPosterUrl,
              plot: !missingPlot
                ? baseMovie.plot
                : tmdbDetails?.overview || "No description available.",
            };
          }
        } catch (fallbackErr) {
          console.error("TMDb fallback error:", fallbackErr);
        }

        setMovie(mergedMovie);
      } catch (err) {
        console.error("Error fetching movie:", err);

        if (err.response?.status === 404) {
          setMovieError("Movie details unavailable.");
        } else {
          setMovieError("Error loading movie.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, TMDB_API_KEY]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!userId) return;

      try {
        const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
        setWatchlist(res.data);
      } catch (err) {
        console.error("Watchlist fetch error:", err);
      }
    };

    if (userId) fetchWatchlist();
  }, [userId, id]);

  const isAdded = watchlist.some((m) => m.movieId === id);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:8081/reviews/movie/${id}`);
      console.log("Reviews response:", res.data.reviews);
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
    if (!movie) return;

    try {
      if (isAdded) {
        setWatchlist((prev) => prev.filter((m) => m.movieId !== id));

        await axios.delete(`http://localhost:8081/watchlist/${userId}/${id}`);
      } else {
        const newItem = {
          userId,
          movieId: movie.id,
          title: movie.title,
        };

        setWatchlist((prev) => [...prev, newItem]);

        await axios.post("http://localhost:8081/watchlist/add", newItem);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Watchlist error");

      const res = await axios.get(`http://localhost:8081/watchlist/${userId}`);
      setWatchlist(res.data);
    }
  };

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

  const openEdit = (r) => {
    setEditingReview(r);
    setEditRating(r.rating);
    setEditText(r.reviewText);
  };

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

  if (loading) {
    return <p className="text-white p-6">Loading...</p>;
  }

  if (movieError) {
    return (
      <div className="flex justify-center p-10 text-white">
        <div className="max-w-3xl w-full bg-gray-900 p-8 rounded-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Movie Unavailable</h1>
          <p className="text-gray-300 text-lg">{movieError}</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex justify-center p-10 text-white">
        <div className="max-w-3xl w-full bg-gray-900 p-8 rounded-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Movie Unavailable</h1>
          <p className="text-gray-300 text-lg">No movie data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-10 text-white">
      <div className="max-w-5xl w-full flex flex-col gap-8">
        <div className="bg-gray-900 p-8 rounded-lg">
          <h1 className="text-4xl font-bold text-center mb-8">{movie.title}</h1>

          <div className="flex gap-8 items-stretch flex-wrap lg:flex-nowrap">
            <div className="w-64 flex-shrink-0">
              {movie.poster && movie.poster !== "N/A" ? (
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-64 h-[384px] object-cover rounded-lg"
                  onError={(e) => {
                    if (movie.tmdbPoster && e.currentTarget.src !== movie.tmdbPoster) {
                      e.currentTarget.src = movie.tmdbPoster;
                    } else {
                      e.currentTarget.style.display = "none";
                    }
                  }}
                />
              ) : movie.tmdbPoster ? (
                <img
                  src={movie.tmdbPoster}
                  alt={movie.title}
                  className="w-64 h-[384px] object-cover rounded-lg"
                />
              ) : (
                <div className="w-64 h-[384px] bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
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
                className={`mt-6 px-6 py-3 rounded text-lg transition duration-200 ${
                  isAdded
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-800"
                }`}
              >
                {isAdded ? "Added ✓" : "Add to Watchlist"}
              </button>
            </div>
          </div>
        </div>

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

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-2xl mb-4">Reviews</h2>

          {reviews.map((r) => (
            <div key={r._id} className="bg-gray-800 p-4 rounded mb-3">
              <div className="flex justify-between">
                <strong>{r.userId?.username || "User"}</strong>
                <div>{"⭐".repeat(r.rating)}</div>
              </div>

              <p className="mt-2">{r.reviewText}</p>

              <small className="text-gray-400">
                {new Date(r.createdAt).toLocaleString()}
                {r.updatedAt && r.updatedAt !== r.createdAt && (
                  <span> • edited</span>
                )}
              </small>

              {String(r.userId?._id) === String(userId) && (
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