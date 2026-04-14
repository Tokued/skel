import React, { useEffect, useState } from "react";
import axios from "axios";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const TrailerRow = () => {
  const [trailers, setTrailers] = useState([]);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [selectedMovieDetails, setSelectedMovieDetails] = useState(null);

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

  const handleTrailerClick = async (trailer) => {
    setSelectedTrailer(trailer);
    setSelectedMovieDetails(null);

    try {
      const [movieRes, externalIdsRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${trailer.id}`, {
          params: { api_key: TMDB_API_KEY, language: "en-US" },
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${trailer.id}/external_ids`, {
          params: { api_key: TMDB_API_KEY },
        }),
      ]);

      setSelectedMovieDetails({
        ...movieRes.data,
        imdb_id: externalIdsRes.data?.imdb_id || null,
      });
    } catch (err) {
      console.error("failed to fetch movie details", err);
    }
  };

  const closeModal = () => {
    setSelectedTrailer(null);
    setSelectedMovieDetails(null);
  };

  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>Featured Trailers</h2>

      <div style={styles.grid}>
        {trailers.map((t) => (
          <div key={t.id} style={styles.card}>
            <h3 style={styles.title}>{t.title}</h3>

            <div
              style={styles.frameWrap}
              onClick={() => handleTrailerClick(t)}
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
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button style={styles.closeButton} onClick={closeModal}>
              ×
            </button>

            <div style={styles.splitModal}>
              <div style={styles.leftPanel}>
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

              <div style={styles.rightPanel}>
                {selectedMovieDetails ? (
                  <>
                    {selectedMovieDetails.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${selectedMovieDetails.poster_path}`}
                        alt={selectedMovieDetails.title}
                        style={styles.sidebarPoster}
                      />
                    ) : null}

                    <h3 style={styles.sidebarTitle}>
                      {selectedMovieDetails.title}
                    </h3>

                    <p style={styles.sidebarMeta}>
                      {selectedMovieDetails.release_date?.slice(0, 4) || "N/A"}
                    </p>

                    <p style={styles.sidebarOverview}>
                      {selectedMovieDetails.overview || "No overview available."}
                    </p>

                    {selectedMovieDetails.imdb_id ? (
                      <a
                        href={`/movies/${selectedMovieDetails.imdb_id}`}
                        style={styles.detailsButton}
                      >
                        View Details
                      </a>
                    ) : (
                      <button style={styles.disabledButton} disabled>
                        View Details Unavailable
                      </button>
                    )}
                  </>
                ) : (
                  <div style={styles.loadingText}>Loading details...</div>
                )}
              </div>
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
    width: "min(1250px, 96vw)",
    background: "#111",
    borderRadius: "16px",
    padding: "20px",
  },

  splitModal: {
    display: "flex",
    gap: "20px",
    alignItems: "stretch",
  },

  leftPanel: {
    flex: 3,
    minWidth: 0,
  },

  rightPanel: {
    flex: 1,
    minWidth: "260px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
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

  sidebarPoster: {
    width: "100%",
    borderRadius: "10px",
    objectFit: "cover",
  },

  sidebarTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "24px",
    lineHeight: "1.2",
  },

  sidebarMeta: {
    margin: 0,
    color: "#aaa",
    fontSize: "14px",
  },

  sidebarOverview: {
    margin: 0,
    color: "#ddd",
    fontSize: "14px",
    lineHeight: "1.45",
  },

  detailsButton: {
    marginTop: "auto",
    textAlign: "center",
    padding: "12px",
    background: "#e50914",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "600",
  },

  disabledButton: {
    marginTop: "auto",
    padding: "12px",
    background: "#333",
    color: "#999",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
  },

  loadingText: {
    color: "#bbb",
    fontSize: "14px",
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
    zIndex: 2,
  },
};

export default TrailerRow;