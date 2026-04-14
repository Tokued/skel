import React, { useEffect, useState } from "react";
import axios from "axios";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const TrailerRow = () => {
  const [trailers, setTrailers] = useState([]);
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  useEffect(() => {
    const fetchTrailers = async () => {
      try {
        const [trendingRes, upcomingRes, nowPlayingRes, popularRes] =
          await Promise.all([
            axios.get("https://api.themoviedb.org/3/trending/movie/week", {
              params: { api_key: TMDB_API_KEY },
            }),
            axios.get("https://api.themoviedb.org/3/movie/upcoming", {
              params: { api_key: TMDB_API_KEY, language: "en-US", page: 1 },
            }),
            axios.get("https://api.themoviedb.org/3/movie/now_playing", {
              params: { api_key: TMDB_API_KEY, language: "en-US", page: 1 },
            }),
            axios.get("https://api.themoviedb.org/3/movie/popular", {
              params: { api_key: TMDB_API_KEY, language: "en-US", page: 1 },
            }),
          ]);

        const mixedPool = [
          ...(upcomingRes.data?.results || []).slice(0, 8),
          ...(trendingRes.data?.results || []).slice(0, 8),
          ...(nowPlayingRes.data?.results || []).slice(0, 6),
          ...(popularRes.data?.results || []).slice(0, 6),
        ];

        const uniqueMovies = Object.values(
          mixedPool.reduce((acc, movie) => {
            acc[movie.id] = movie;
            return acc;
          }, {})
        ).sort(() => 0.5 - Math.random());

        const trailerData = await Promise.all(
          uniqueMovies.map(async (movie) => {
            try {
              const videoRes = await axios.get(
                `https://api.themoviedb.org/3/movie/${movie.id}/videos`,
                {
                  params: { api_key: TMDB_API_KEY },
                }
              );

              const results = videoRes.data?.results || [];

              const trailer =
                results.find(
                  (vid) =>
                    vid.site === "YouTube" &&
                    vid.type === "Trailer" &&
                    vid.official === true
                ) ||
                results.find(
                  (vid) =>
                    vid.site === "YouTube" &&
                    vid.type === "Trailer"
                ) ||
                results.find(
                  (vid) =>
                    vid.site === "YouTube" &&
                    vid.type === "Teaser"
                ) ||
                results.find((vid) => vid.site === "YouTube");

              return trailer
                ? {
                    id: movie.id,
                    title: movie.title,
                    youtubeKey: trailer.key,
                  }
                : null;
            } catch {
              return null;
            }
          })
        );

        setTrailers(trailerData.filter(Boolean).slice(0, 6));
      } catch (err) {
        console.error("error fetching trailers:", err);
      }
    };

    fetchTrailers();
  }, []);

  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>Featured Trailers</h2>

      <div style={styles.grid}>
        {trailers.map((t) => (
          <div key={t.id} style={styles.card}>
            <h3 style={styles.title}>{t.title}</h3>

            {/* ✅ FIXED: thumbnail instead of iframe */}
            <div
              style={styles.frameWrap}
              onClick={() => setSelectedTrailer(t)}
            >
              <img
                src={`https://img.youtube.com/vi/${t.youtubeKey}/hqdefault.jpg`}
                alt={t.title}
                style={styles.thumbnail}
              />
              <div style={styles.playOverlay}>
                <div style={styles.playButton}>▶</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTrailer && (
        <div
          style={styles.modalOverlay}
          onClick={() => setSelectedTrailer(null)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={styles.closeButton}
              onClick={() => setSelectedTrailer(null)}
            >
              ×
            </button>

            <h3 style={styles.modalTitle}>{selectedTrailer.title}</h3>

            <div style={styles.modalFrameWrap}>
              <iframe
                style={styles.modalIframe}
                src={`https://www.youtube.com/embed/${selectedTrailer.youtubeKey}?autoplay=1`}
                title={selectedTrailer.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  section: {
    marginTop: "50px",
  },

  heading: {
    color: "#e0e0e0",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "24px",
  },

  card: {
    background: "#1e1e1e",
    padding: "14px",
    borderRadius: "14px",
  },

  title: {
    margin: "0 0 14px 0",
    fontSize: "18px",
    lineHeight: "1.25",
    color: "#fff",
    minHeight: "46px",
    wordBreak: "break-word",
    textAlign: "center",
  },

  frameWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#000",
    cursor: "pointer",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  playOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.18)",
  },

  playButton: {
    background: "rgba(255,0,0,0.9)",
    color: "#fff",
    width: "70px",
    height: "50px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },

  modalContent: {
    position: "relative",
    width: "min(1100px, 95vw)",
    background: "#111",
    borderRadius: "16px",
    padding: "20px",
  },

  modalTitle: {
    margin: "0 0 16px 0",
    color: "#fff",
    textAlign: "center",
    fontSize: "26px",
  },

  modalFrameWrap: {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#000",
  },

  modalIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  },

  closeButton: {
    position: "absolute",
    top: "10px",
    right: "14px",
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "32px",
    cursor: "pointer",
    lineHeight: 1,
  },
};

export default TrailerRow;