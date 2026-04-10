import React, { useEffect, useState } from "react";
import axios from "axios";

const MovieTrailer = ({ imdbID, title }) => {
  const [trailer, setTrailer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (!imdbID) return;

      try {
        const res = await axios.get(`http://localhost:8081/trailers/${imdbID}`);
        setTrailer(res.data);
      } catch (error) {
        console.error("Error fetching trailer:", error);
      }
    };

    fetchTrailer();
  }, [imdbID]);

  if (!trailer || !trailer.youtubeId) {
    return (
            <div className="w-full h-[384px] bg-black p-2 rounded-xl">
        No trailer found
      </div>
    );
  }

  return isPlaying ? (
    <iframe
      className="w-full h-[384px] rounded-lg"
      src={`https://www.youtube.com/embed/${trailer.youtubeId}?autoplay=1&modestbranding=1&rel=0`}
      title={`${title} trailer`}
      allow="autoplay; encrypted-media"
      allowFullScreen
    />
  ) : (
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
  );
};

export default MovieTrailer;