import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const PersonPage = () => {
  const { personId } = useParams();
  const navigate = useNavigate();

  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w500";
  const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";

  const [person, setPerson] = useState(null);
  const [personImages, setPersonImages] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true);
      setShowFullBio(false);

      try {
        const [personRes, creditsRes, imagesRes] = await Promise.all([
          axios.get(
            `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}`
          ),
          axios.get(
            `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`
          ),
          axios.get(
            `https://api.themoviedb.org/3/person/${personId}/images?api_key=${TMDB_API_KEY}`
          ),
        ]);

        setPerson(personRes.data);
        setPersonImages(imagesRes.data?.profiles || []);

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
          })
          .slice(0, 12);

        const creditsWithImdb = await Promise.all(
          sortedCredits.map(async (movie) => {
            try {
              const externalRes = await axios.get(
                `https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${TMDB_API_KEY}`
              );

              return {
                ...movie,
                imdb_id: externalRes.data.imdb_id,
              };
            } catch {
              return {
                ...movie,
                imdb_id: null,
              };
            }
          })
        );

        setCredits(creditsWithImdb.filter((movie) => movie.imdb_id));
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

  // 🔥 Pick ONE background image (not same as profile)
  const backgroundImage =
    personImages.find((img) => img.file_path !== person.profile_path) ||
    personImages[0] ||
    null;

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* 🔥 CLEAN CINEMATIC BACKGROUND */}
      {backgroundImage && (
        <div
          className="fixed inset-0 bg-cover bg-center blur-xl scale-110 opacity-40"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${backgroundImage.file_path})`,
          }}
        />
      )}

      {/* DARK OVERLAY */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black" />

      <div className="relative z-10 p-8 max-w-6xl mx-auto">

        {/* PROFILE CARD */}
        <section className="bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8">

            {/* IMAGE */}
            <div className="w-72 flex-shrink-0">
              {person.profile_path ? (
                <img
                  src={`${TMDB_PROFILE_BASE}${person.profile_path}`}
                  alt={person.name}
                  className="rounded-2xl w-full shadow-2xl border border-white/10"
                />
              ) : (
                <div className="w-full h-96 bg-gray-800 rounded-2xl flex items-center justify-center">
                  No Image
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="flex-1">
              <h1 className="text-5xl font-extrabold mb-2">
                {person.name}
              </h1>

              <p className="text-gray-300 mb-6">
                {person.birthday || "Unknown"} •{" "}
                {person.place_of_birth || "Unknown"}
              </p>

              <h2 className="text-3xl font-bold mb-3">Biography</h2>

              <p
                className={`text-gray-200 leading-8 text-lg ${
                  showFullBio ? "" : "line-clamp-5"
                }`}
              >
                {person.biography || "No biography available."}
              </p>

              {person.biography && person.biography.length > 350 && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="mt-4 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg text-blue-300 font-semibold transition"
                >
                  {showFullBio ? "Show Less" : "Read More"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* KNOWN FOR */}
        {credits.length > 0 && (
          <section className="mt-8 bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-5">Known For</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {credits.slice(0, 10).map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => {
                    if (movie.imdb_id) {
                      navigate(`/movies/${movie.imdb_id}`);
                    }
                  }}
                  className="group text-center cursor-pointer hover:scale-105 transition"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-xl border border-white/10 bg-white/5">
                    <img
                      src={`${TMDB_POSTER_BASE}${movie.poster_path}`}
                      alt={movie.title || "Movie poster"}
                      className="w-full h-[280px] object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-white leading-tight">
                    {movie.title}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PersonPage;