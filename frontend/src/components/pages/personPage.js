import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const PersonPage = () => {
  const { personId } = useParams();
  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w500";

  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true);

      try {
        const [personRes, creditsRes] = await Promise.all([
          axios.get(
            `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}`
          ),
          axios.get(
            `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`
          ),
        ]);

        setPerson(personRes.data);
        const sortedCredits = (creditsRes.data.cast || [])
  .filter((movie) => movie.poster_path)
  .filter((movie) => movie.vote_count >= 50)
  .sort((a, b) => {
    const bScore =
      (b.popularity || 0) * 2 +
      (b.vote_average || 0) * 8 +
      Math.min(b.vote_count || 0, 1000) / 100;

    const aScore =
      (a.popularity || 0) * 2 +
      (a.vote_average || 0) * 8 +
      Math.min(a.vote_count || 0, 1000) / 100;

    return bScore - aScore;
  });

setCredits(sortedCredits);
      } catch (err) {
        console.error("Error fetching person:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [personId, TMDB_API_KEY]);

  if (loading) {
    return <p className="text-white p-6">Loading actor...</p>;
  }

  if (!person) {
    return <p className="text-white p-6">Actor not found.</p>;
  }

  return (
    <div className="text-white p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Profile Image */}
        <div className="w-64 flex-shrink-0">
          {person.profile_path ? (
            <img
              src={`${TMDB_PROFILE_BASE}${person.profile_path}`}
              alt={person.name}
              className="rounded-lg w-full"
            />
          ) : (
            <div className="w-full h-80 bg-gray-800 flex items-center justify-center">
              No Image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{person.name}</h1>

          <p className="text-gray-400 mb-4">
            {person.birthday || "Unknown"} • {person.place_of_birth || "Unknown"}
          </p>

          <h2 className="text-2xl font-semibold mb-2">Biography</h2>
          <p className="text-gray-300 leading-7">
            {person.biography || "No biography available."}
          </p>
        </div>
      </div>

      {/* Known For */}
      {credits.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Known For</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {credits.slice(0, 10).map((movie) => (
              <div key={movie.id} className="text-center">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    className="rounded mb-2"
                  />
                ) : (
                  <div className="h-40 bg-gray-700 flex items-center justify-center">
                    No Image
                  </div>
                )}

                <p className="text-sm">{movie.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonPage;