import React, { useEffect, useState } from "react";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const user = getUserInfo();

  useEffect(() => {
    if (!user?.id) return;

    const fetchFavorites = async () => {
      try {
        // 1. Fetch raw watchlist
        const res = await axios.get(`http://localhost:8081/watchlist/${user.id}`);
        const watchlist = res.data.filter((m) => m.favorite);

        // 2. Fetch movie details for each favorite
        const movieDetails = await Promise.all(
          watchlist.map((m) =>
            axios.get(`http://localhost:8081/movies/${m.movieId}`)
          )
        );

        // 3. Merge watchlist + movie details
        const merged = movieDetails.map((r, i) => ({
          ...watchlist[i],
          ...r.data,
        }));

        setFavorites(merged);
      } catch (err) {
        console.error("Favorites error:", err);
      }
    };

    fetchFavorites();
  }, [user]);

  return (
    <div className="container mt-5 text-white">
      <h1 className="mb-4">Your Favorites</h1>

      {favorites.length === 0 && <p>No favorites yet.</p>}

      <div className="d-flex flex-wrap gap-4">
        {favorites.map((movie) => (
          <div key={movie.id} style={{ width: "150px" }}>
            <img
              src={movie.poster}
              alt={movie.title}
              style={{
                width: "100%",
                borderRadius: "10px",
                boxShadow: "0 0 10px rgba(0,0,0,0.5)",
              }}
            />
            <p className="mt-2">{movie.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}