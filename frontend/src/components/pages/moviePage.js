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
  const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/original";
  const { id } = useParams();

  const rowRef = useRef(null);
  const scrollAmount = 396;

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
          backdrop: null,
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

            const backdropUrl = tmdbDetails?.backdrop_path
              ? `${TMDB_BACKDROP_BASE}${tmdbDetails.backdrop_path}`
              : tmdbPosterUrl;

            const missingPoster = !baseMovie?.poster || baseMovie.poster === "N/A";
            const missingPlot = !baseMovie?.plot || baseMovie.plot === "N/A";

            mergedMovie = {
              ...baseMovie,
              title: baseMovie?.title || tmdbDetails?.title || "N/A",
              poster: !missingPoster ? baseMovie.poster : tmdbPosterUrl,
              tmdbPoster: tmdbPosterUrl,
              backdrop: backdropUrl,
              plot: !missingPlot
                ? baseMovie.plot
                : tmdbDetails?.overview || "No description available.",
              year:
                baseMovie?.year ||
                tmdbDetails?.release_date?.slice(0, 4) ||
                "N/A",
              runtime: baseMovie?.runtime || `${tmdbDetails?.runtime || "N/A"} min`,
              rating: baseMovie?.rated || baseMovie?.rating || "Movie",
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

        const recsWithImdb = await Promise.all(
          (res.data.results || [])
            .filter((rec) => rec.poster_path)
            .slice(0, 12)
            .map(async (rec) => {
              try {
                const externalRes = await axios.get(
                  `https://api.themoviedb.org/3/movie/${rec.id}/external_ids?api_key=${TMDB_API_KEY}`
                );

                return {
                  ...rec,
                  imdb_id: externalRes.data.imdb_id,
                };
              } catch {
                return {
                  ...rec,
                  imdb_id: null,
                };
              }
            })
        );

        setRecommendations(recsWithImdb.filter((rec) => rec.imdb_id));
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

  const reportReview = async (reviewId) => {
    if (!window.confirm("Report this review to admin moderation?")) return;

    try {
      await axios.put(`http://localhost:8081/reviews/${reviewId}/flag`);
      fetchReviews();
      alert("Review reported. Admins can review it in the flagged queue.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to report review");
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;

    try {
      await axios.delete(`http://localhost:8081/reviews/${reviewId}`, {
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
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {movie.backdrop && (
        <div
          className="fixed inset-0 bg-cover bg-center opacity-30 blur-sm scale-105"
          style={{ backgroundImage: `url(${movie.backdrop})` }}
        />
      )}

      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/80 to-black" />

      <style>{`
        .recommendations-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="relative z-10 flex justify-center p-8">
        <div className="max-w-6xl w-full flex flex-col gap-8">
          <section className="bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-5xl font-extrabold text-center mb-4">
              {movie.title}
            </h1>

            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              <span className="bg-red-600/80 px-3 py-1 rounded-full text-sm">
               📅 {movie.year || "N/A"}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
               ⭐ {movie.rating || "Movie"}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
               🕓 {movie.runtime || "Runtime N/A"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-stretch">
              <div>
                {movie.poster && movie.poster !== "N/A" ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-[420px] object-cover rounded-2xl shadow-xl"
                    onError={(e) => {
                      if (
                        movie.tmdbPoster &&
                        e.currentTarget.src !== movie.tmdbPoster
                      ) {
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
                    className="w-full h-[420px] object-cover rounded-2xl shadow-xl"
                  />
                ) : (
                  <div className="w-full h-[420px] bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl">
                <MovieTrailer imdbID={movie.id} title={movie.title} />
              </div>
            </div>

            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-2xl font-bold mb-3">Overview</h2>
              <p className="text-gray-200 text-lg leading-8">{movie.plot}</p>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={toggleWatchlist}
                className={`px-7 py-3 rounded-xl text-lg font-semibold transition duration-200 shadow-lg ${
                  isAdded
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-800"
                }`}
              >
                {isAdded ? "Added ✓" : "Add to Watchlist"}
              </button>
            </div>
          </section>

          {(movie.cast?.length > 0 || movie.crew?.length > 0) && (
            <section className="bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
              {movie.cast?.length > 0 && (
                <div className="relative">
                  <h2 className="text-3xl font-bold mb-5">Cast</h2>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCastIndex((prev) => Math.max(prev - 1, 0))}
                      disabled={castIndex === 0}
                      className="bg-black/70 hover:bg-black px-3 py-2 rounded-full disabled:opacity-30"
                    >
                      ‹
                    </button>

                    <div className="flex gap-5 overflow-hidden flex-1">
                      {movie.cast.slice(castIndex, castIndex + 5).map((actor) => (
                        <div
                          key={actor.id}
                          onClick={() => navigate(`/person/${actor.id}`)}
                          className="bg-white/10 border border-white/10 rounded-2xl overflow-hidden text-center min-w-[150px] max-w-[150px] cursor-pointer hover:scale-105 hover:bg-white/15 transition shadow-lg"
                        >
                          {actor.profile_path ? (
                            <img
                              src={`${TMDB_PROFILE_BASE}${actor.profile_path}`}
                              alt={actor.name}
                              className="w-full h-44 object-cover"
                            />
                          ) : (
                            <div className="w-full h-44 bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
                              No Image
                            </div>
                          )}

                          <div className="p-3">
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
                <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h2 className="text-3xl font-bold mb-4">Crew</h2>

                  {groupedCrew.length > 0 ? (
                    groupedCrew.map((group) => (
                      <p key={group.job} className="mb-2 text-gray-200">
                        <strong className="text-white">{group.label}:</strong>{" "}
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
                      className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                    >
                      {showAllCrew ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">Add Review</h2>

            <StarSelector value={rating} setValue={setRating} />

            <input
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full mt-3 p-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400"
              placeholder="Write review..."
            />

            <button
              onClick={submitReview}
              className="mt-3 bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg"
            >
              Submit
            </button>
          </section>

          <section className="bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">Reviews</h2>

            {reviews.map((r) => (
              <div
                key={r._id}
                className="bg-white/10 border border-white/10 p-4 rounded-2xl mb-3"
              >
                <div className="flex justify-between">
                  <strong>{r.userId?.username || "User"}</strong>
                  <div>{"⭐".repeat(r.rating)}</div>
                </div>

                <p className="mt-2">{r.reviewText}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {r.flagged && (
                    <span className="text-yellow-300 font-semibold">🚩 Reported</span>
                  )}

                  <small className="text-gray-400">
                    {new Date(r.createdAt).toLocaleString()}
                    {r.updatedAt && r.updatedAt !== r.createdAt && (
                      <span> • edited</span>
                    )}
                  </small>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {String(r.userId?._id) === String(userId) && (
                    <>
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
                    </>
                  )}

                  <button
                    onClick={() => reportReview(r._id)}
                    disabled={r.flagged}
                    className={`px-3 py-1 rounded ${r.flagged ? "bg-gray-600 text-gray-200" : "bg-yellow-500 text-black hover:bg-yellow-400"}`}
                  >
                    {r.flagged ? "Reported" : "Report"}
                  </button>
                </div>
              </div>
            ))}
          </section>

          {recommendations.length > 0 && (
            <section className="bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">
                You Might Also Like
              </h2>

              <div className="relative">
                <button
                  onClick={scrollLeft}
                  className="absolute left-2 top-[135px] z-20 bg-black/80 hover:bg-black w-10 h-10 rounded-full text-white text-2xl flex items-center justify-center"
                >
                  ‹
                </button>

                <div
                  ref={rowRef}
                  className="recommendations-scroll flex gap-6 overflow-x-auto scroll-smooth px-14 pb-4"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => navigate(`/movies/${rec.imdb_id}`)}
                      className="flex-shrink-0 w-52 cursor-pointer hover:scale-105 transition"
                    >
                      <img
                        src={`${TMDB_IMAGE_BASE}${rec.poster_path}`}
                        alt={rec.title || "Recommended movie"}
                        className="w-full h-[300px] object-cover rounded-2xl shadow-xl"
                      />

                      <p className="mt-2 text-sm font-semibold text-white leading-tight">
                        {rec.title}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={scrollRight}
                  className="absolute right-2 top-[135px] z-20 bg-black/80 hover:bg-black w-10 h-10 rounded-full text-white text-2xl flex items-center justify-center"
                >
                  ›
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center">
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