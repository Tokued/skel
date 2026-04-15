import React, { useEffect, useState } from "react";
import axios from "axios";

const MovieTrailer = ({ imdbID, title }) => {
  const [trailer, setTrailer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (!imdbID && !title) return;

      try {
        const res = await axios.get(`http://localhost:8081/trailers/${imdbID || "unknown"}`, {
          params: { title },
        });
        setTrailer(res.data);
      } catch (error) {
        console.error("Error fetching trailer:", error);
        setTrailer(null);
      }
    };

    fetchTrailer();
    setIsPlaying(false);
  }, [imdbID, title]);

  if (!trailer || !trailer.youtubeId) {
    return (
      <div className="w-full h-[384px] bg-black rounded-xl flex items-center justify-center text-gray-300 text-lg">
        No trailer available
      </div>
    );
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.youtubeId}`;
  const embedUrl = `https://www.youtube.com/embed/${trailer.youtubeId}?autoplay=1&modestbranding=1&rel=0`;

  return (
    <div className="w-full">
      {isPlaying ? (
        <div className="w-full">
          <iframe
            className="w-full h-[384px] rounded-lg"
            src={embedUrl}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />

          <div className="mt-3 text-center">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-red-400 hover:text-red-300 underline"
            >
              Trailer not working? Watch on YouTube
            </a>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div
            className="relative w-full h-[384px] rounded-lg overflow-hidden cursor-pointer bg-black"
            onClick={() => setIsPlaying(true)}
          >
            <img
              src={`https://img.youtube.com/vi/${trailer.youtubeId}/maxresdefault.jpg`}
              alt={`${title} trailer thumbnail`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://img.youtube.com/vi/${trailer.youtubeId}/hqdefault.jpg`;
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-[72px] h-[50px] rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-white ml-1"></div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-center">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-red-400 hover:text-red-300 underline"
            >
              Trailer not working? Watch on YouTube
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieTrailer;