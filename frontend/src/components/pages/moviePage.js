import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";
import MovieTrailer from "../MovieTrailer";

const MoviePage = () => {
  const navigate = useNavigate();
  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
  const TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w342";
  const { id } = useParams();

  const rowRef = useRef(null);
  const scrollAmount = 396;

  const scrollLeft = () => {
    const row = rowRef.current;
    if (!row) return;

    if (row.scrollLeft <= 10) {
      row.scrollTo({
        left: row.scrollWidth - row.clientWidth,
        behavior: "smooth",
      });
    } else {
      row.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const row = rowRef.current;
    if (!row) return;

    const maxScrollLeft = row.scrollWidth - row.clientWidth;

    if (row.scrollLeft >= maxScrollLeft - 10) {
      row.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      row.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

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

  const [castIndex, setCastIndex] = useState(0);
  const [showAllCrew, setShowAllCrew] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [tmdbMovieId, setTmdbMovieId] = useState(null);

  const userId = user?.id || user?._id;

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  useEffect(() => {
    setCastIndex(0);
    setShowAllCrew(false);
    setRecommendations([]);
    setTmdbMovieId(null);
  }, [id]);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setMovieError("");
      setMovie(null);
      setTmdbMovieId(null);

      try {
        const res = await axios.get(`http://localhost:8081/movies/${id}`);
        const baseMovie = res.data;

        let mergedMovie = {
          ...baseMovie,
          tmdbPoster: null,
          cast: [],
          crew: [],
        };

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
            setTmdbMovieId(tmdbMovie.id);

            const detailsRes = await axios.get(
              `https://api.themoviedb.org/3/movie/${tmdbMovie.id}?api_key=${TMDB_API_KEY}`
            );

            const creditsRes = await axios.get(
              `https://api.themoviedb.org/3/movie/${tmdbMovie.id}/credits?api_key=${TMDB_API_KEY}`
            );

            const tmdbDetails = detailsRes.data;
            const tmdbCredits = creditsRes.data;

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
              cast: tmdbCredits?.cast?.slice(0, 20) || [],
              crew: tmdbCredits?.crew || [],
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
    const fetchRecommendations = async () => {
      if (!tmdbMovieId) return;

      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/movie/${tmdbMovieId}/recommendations?api_key=${TMDB_API_KEY}`
        );

        setRecommendations(
          res.data.results?.filter((rec) => rec.poster_path).slice(0, 12) || []
        );
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };

    fetchRecommendations();
  }, [tmdbMovieId, TMDB_API_KEY]);

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

  const crewRoleLabels = {
    Director: "Director",
    Writer: "Writers",
    Screenplay: "Screenplay",
    Story: "Story",
    Producer: "Producers",
    "Executive Producer": "Executive Producers",
    "Director of Photography": "Cinematography",
    Editor: "Editors",
    "Original Music Composer": "Music",
    Casting: "Casting",
  };

  const priorityOrder = [
    "Director",
    "Writer",
    "Screenplay",
    "Story",
    "Producer",
    "Executive Producer",
    "Director of Photography",
    "Editor",
    "Original Music Composer",
    "Casting",
  ];

  const compactLimits = {
    Director: 2,
    Writer: 2,
    Screenplay: 2,
    Story: 2,
    Producer: 3,
    "Executive Producer": 2,
    "Director of Photography": 1,
    Editor: 2,
    "Original Music Composer": 1,
    Casting: 2,
  };

  const groupedCrew = priorityOrder
    .map((job) => {
      const people =
        movie.crew
          ?.filter((person) => person.job === job)
          ?.filter(
            (person, index, self) =>
              index === self.findIndex((p) => p.name === person.name)
          ) || [];

      const visiblePeople = showAllCrew
        ? people
        : people.slice(0, compactLimits[job] || 1);

      return {
        job,
        label: crewRoleLabels[job] || job,
        people: visiblePeople,
        total: people.length,
      };
    })
    .filter((group) => group.people.length > 0);

  const hasHiddenCrew = groupedCrew.some(
    (group) => group.total > group.people.length
  );

  return (
    <div className="flex justify-center p-10 text-white">
      <style>{`
        .recommendations-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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

            <div className="flex justify-center mt-6">
              <button
                onClick={toggleWatchlist}
                className={`px-6 py-3 rounded text-lg transition duration-200 ${
                  isAdded
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-800"
                }`}
              >
                {isAdded ? "Added ✓" : "Add to Watchlist"}
              </button>
            </div>

            {(movie.cast?.length > 0 || movie.crew?.length > 0) && (
              <div className="mt-8">
                {movie.cast?.length > 0 && (
                  <div className="relative">
                    <h2 className="text-2xl font-bold mb-4">Cast</h2>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setCastIndex((prev) => Math.max(prev - 1, 0))}
                        disabled={castIndex === 0}
                        className="bg-black/70 hover:bg-black px-3 py-2 rounded-full disabled:opacity-30"
                      >
                        ‹
                      </button>

                      <div className="flex gap-4 overflow-hidden flex-1">
                        {movie.cast.slice(castIndex, castIndex + 5).map((actor) => (
                          <div
                            key={actor.id}
                            onClick={() => navigate(`/person/${actor.id}`)}
                            className="bg-gray-800 rounded-lg overflow-hidden text-center min-w-[140px] max-w-[140px] cursor-pointer hover:scale-105 transition"
                          >
                            {actor.profile_path ? (
                              <img
                                src={`${TMDB_PROFILE_BASE}${actor.profile_path}`}
                                alt={actor.name}
                                className="w-full h-40 object-cover"
                              />
                            ) : (
                              <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
                                No Image
                              </div>
                            )}

                            <div className="p-2">
                              <p className="font-bold text-sm leading-tight">
                                {actor.name}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 leading-tight">
                                {actor.character || "Character unavailable"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          setCastIndex((prev) =>
                            Math.min(prev + 1, Math.max(movie.cast.length - 5, 0))
                          )
                        }
                        disabled={castIndex >= movie.cast.length - 5}
                        className="bg-black/70 hover:bg-black px-3 py-2 rounded-full disabled:opacity-30"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}

                {movie.crew?.length > 0 && (
                  <div className="mt-8 bg-gray-800 rounded-lg p-4">
                    <h2 className="text-2xl font-bold mb-3">Crew</h2>

                    {groupedCrew.length > 0 ? (
                      groupedCrew.map((group) => (
                        <p key={group.job} className="mb-2">
                          <strong>{group.label}:</strong>{" "}
                          {group.people.map((person) => person.name).join(", ")}
                          {!showAllCrew && group.total > group.people.length && (
                            <span className="text-gray-400">
                              {" "}
                              +{group.total - group.people.length} more
                            </span>
                          )}
                        </p>
                      ))
                    ) : (
                      <p>No crew information available.</p>
                    )}

                    {hasHiddenCrew && (
                      <button
                        onClick={() => setShowAllCrew(!showAllCrew)}
                        className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                      >
                        {showAllCrew ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
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

        {recommendations.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                You Might Also Like
              </h2>
            </div>

            <div className="relative group">
              <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

              <button
                onClick={scrollLeft}
                className="opacity-0 group-hover:opacity-100 transition absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black p-3 rounded-full shadow-lg backdrop-blur"
              >
                ‹
              </button>

              <div
                ref={rowRef}
                className="recommendations-scroll flex gap-6 overflow-x-auto scroll-smooth px-8 snap-x snap-mandatory"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => navigate(`/movies/${rec.id}`)}
                    className="relative flex-shrink-0 w-52 cursor-pointer group/card snap-start"
                  >
                    <div className="relative overflow-hidden rounded-2xl shadow-xl transform transition duration-300 group-hover/card:scale-105">
                      <img
                        src={`${TMDB_IMAGE_BASE}${rec.poster_path}`}
                        alt={rec.title}
                        className="w-full h-[300px] object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition" />

                      <div className="absolute bottom-0 p-3 opacity-0 group-hover/card:opacity-100 transition">
                        <p className="text-sm font-semibold leading-tight">
                          {rec.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={scrollRight}
                className="opacity-0 group-hover:opacity-100 transition absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black p-3 rounded-full shadow-lg backdrop-blur"
              >
                ›
              </button>
            </div>
          </div>
        )}
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