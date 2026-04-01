import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const MoviePage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdded, setIsAdded] = useState(false);

  const userId = user?.id;

  // Load user info
  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  // Fetch movie details
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

  // Add/remove from watchlist
  const toggleWatchlist = async () => {
    if (!userId) return alert("You must be logged in");

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

  if (!movie) {
    return <p className="text-white p-6 text-xl">Loading...</p>;
  }

  return (
    <div className="flex justify-center p-10 text-white">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-4xl w-full flex gap-8">
        
        {/* Poster */}
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-64 rounded-lg shadow-md"
        />

        {/* Movie Info */}
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3">{movie.title}</h1>
            <p className="text-gray-300 mb-2"><strong>Year:</strong> {movie.year}</p>
            <p className="text-gray-300 mb-2"><strong>Genre:</strong> {movie.genre}</p>
            <p className="text-gray-300 mb-2"><strong>Runtime:</strong> {movie.runtime}</p>
            <p className="text-gray-300 mb-2"><strong>Rating:</strong> ⭐ {movie.rating}</p>

            <p className="text-gray-200 mt-4 leading-relaxed">
              {movie.plot}
            </p>
          </div>

          {/* Watchlist Button */}
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
    </div>
  );
};

export default MoviePage;