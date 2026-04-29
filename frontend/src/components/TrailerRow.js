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
        const [upcomingRes, nowPlayingRes] = await Promise.all([
          axios.get("https://api.themoviedb.org/3/movie/upcoming", {
            params: { api_key: TMDB_API_KEY, language: "en-US", page: 1 },
          }),
          axios.get("https://api.themoviedb.org/3/movie/now_playing", {
            params: { api_key: TMDB_API_KEY, language: "en-US", page: 1 },
          }),
        ]);

        const today = new Date();

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        const sixMonthsAhead = new Date();
        sixMonthsAhead.setMonth(today.getMonth() + 6);

        const mixedPool = [
          ...(upcomingRes.data?.results || []),
          ...(nowPlayingRes.data?.results || []),
        ];

        const uniqueMovies = Object.values(
          mixedPool.reduce((acc, movie) => {
            if (!movie?.id || !movie?.release_date) return acc;

            const releaseDate = new Date(movie.release_date);
            const isRecentOrUpcoming =
              releaseDate >= ninetyDaysAgo && releaseDate <= sixMonthsAhead;

            if (isRecentOrUpcoming) {
              acc[movie.id] = movie;
            }

            return acc;
          }, {})
        ).sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

        const trailerData = await Promise.all(
          uniqueMovies.slice(0, 24).map(async (movie) => {
            try {
              const videoRes = await axios.get(
                `https://api.themoviedb.org/3/movie/${movie.id}/videos`,
                {
                  params: { api_key: TMDB_API_KEY, language: "en-US" },
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
                  (vid) => vid.site === "YouTube" && vid.type === "Trailer"
                ) ||
                results.find(
                  (vid) => vid.site === "YouTube" && vid.type === "Teaser"
                );

              if (!trailer) return null;

              return {
                id: movie.id,
                title: movie.title,
                releaseDate: movie.release_date,
                posterPath: movie.poster_path,
                backdropPath: movie.backdrop_path,
                overview: movie.overview,
                youtubeKey: trailer.key,
              };
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
      const [movieRes, externalIdsRes, creditsRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${trailer.id}`, {
          params: { api_key: TMDB_API_KEY, language: "en-US" },
        }),
        axios.get(
          `https://api.themoviedb.org/3/movie/${trailer.id}/external_ids`,
          {
            params: { api_key: TMDB_API_KEY },
          }
        ),
        axios.get(`https://api.themoviedb.org/3/movie/${trailer.id}/credits`, {
          params: { api_key: TMDB_API_KEY, language: "en-US" },
        }),
      ]);

      const director =
        creditsRes.data?.crew?.find((person) => person.job === "Director")
          ?.name || "N/A";

      setSelectedMovieDetails({
        ...movieRes.data,
        imdb_id: externalIdsRes.data?.imdb_id || null,
        cast: creditsRes.data?.cast?.slice(0, 6) || [],
        director,
      });
    } catch (err) {
      console.error("failed to fetch movie details", err);
    }
  };

  const closeModal = () => {
    setSelectedTrailer(null);
    setSelectedMovieDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>Fresh Trailers</h2>

      <div style={styles.grid}>
        {trailers.map((t) => (
          <div key={t.id} style={styles.card}>
            <div
              style={styles.cardImageWrap}
              onClick={() => handleTrailerClick(t)}
            >
              <img
                src={`https://img.youtube.com/vi/${t.youtubeKey}/hqdefault.jpg`}
                alt={t.title}
                style={styles.thumbnail}
              />

              <div style={styles.cardGradient} />

              <div style={styles.playOverlay}>
                <div style={styles.playButton}>▶</div>
              </div>
            </div>

            <div style={styles.cardBody}>
              <h3 style={styles.title}>{t.title}</h3>

              {t.releaseDate && (
                <p style={styles.releaseDate}>
                  {new Date(t.releaseDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTrailer && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={closeModal}>
              ×
            </button>

            <div style={styles.modalLayout}>
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

                {selectedMovieDetails?.cast?.length > 0 && (
                  <div style={styles.castSection}>
                    <h3 style={styles.castHeading}>Cast</h3>

                    <div style={styles.castRow}>
                      {selectedMovieDetails.cast.map((actor) => (
                        <div key={actor.id} style={styles.castCard}>
                          {actor.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                              alt={actor.name}
                              style={styles.castImage}
                            />
                          ) : (
                            <div style={styles.castPlaceholder}>?</div>
                          )}

                          <div style={styles.castTextBox}>
                            <p style={styles.castName}>{actor.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

                    <h2 style={styles.sidebarTitle}>
                      {selectedMovieDetails.title}
                    </h2>

                    <p style={styles.sidebarMeta}>
                      {selectedMovieDetails.release_date?.slice(0, 4) || "N/A"}
                      {selectedMovieDetails.runtime
                        ? ` • ${selectedMovieDetails.runtime} min`
                        : ""}
                    </p>

                    <p style={styles.sidebarOverview}>
                      {selectedMovieDetails.overview || "No overview available."}
                    </p>

                    <div style={styles.sidebarDivider} />

                    <div style={styles.factRow}>
                      <span style={styles.factLabel}>Release Date</span>
                      <span style={styles.factValue}>
                        {formatDate(selectedMovieDetails.release_date)}
                      </span>
                    </div>

                    <div style={styles.factRow}>
                      <span style={styles.factLabel}>Director</span>
                      <span style={styles.factValue}>
                        {selectedMovieDetails.director}
                      </span>
                    </div>

                    <div style={styles.factRow}>
                      <span style={styles.factLabel}>Genres</span>
                      <span style={styles.factValue}>
                        {selectedMovieDetails.genres?.length
                          ? selectedMovieDetails.genres
                              .map((genre) => genre.name)
                              .join(", ")
                          : "N/A"}
                      </span>
                    </div>

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
    marginTop: "60px",
  },

  heading: {
    color: "#fff",
    marginBottom: "24px",
    fontSize: "34px",
    fontWeight: "800",
    letterSpacing: "0.3px",
    textShadow: "0 4px 18px rgba(0,0,0,0.8)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "28px",
  },

  card: {
    background:
      "linear-gradient(180deg, rgba(35,35,35,0.98), rgba(12,12,12,0.98))",
    borderRadius: "22px",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 18px 42px rgba(0,0,0,0.45)",
    overflow: "hidden",
  },

  cardImageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    overflow: "hidden",
    background: "#000",
    cursor: "pointer",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    filter: "brightness(0.82)",
  },

  cardGradient: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.65))",
  },

  playOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  playButton: {
    background: "rgba(229, 9, 20, 0.96)",
    color: "#fff",
    width: "74px",
    height: "52px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    boxShadow: "0 10px 28px rgba(229,9,20,0.38)",
  },

  cardBody: {
    padding: "16px 18px 18px",
    textAlign: "center",
  },

  title: {
    margin: "0 0 12px 0",
    fontSize: "20px",
    lineHeight: "1.25",
    color: "#fff",
    minHeight: "50px",
    wordBreak: "break-word",
    textAlign: "center",
    fontWeight: "800",
  },

  releaseDate: {
    display: "inline-block",
    color: "#ddd",
    fontSize: "13px",
    margin: 0,
    background: "rgba(255,255,255,0.08)",
    padding: "6px 12px",
    borderRadius: "999px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.86)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "12px",
  },

  modalContent: {
    position: "relative",
    width: "min(1560px, 99vw)",
    maxHeight: "96vh",
    overflowY: "auto",
    background: "linear-gradient(180deg, #101010, #050505)",
    borderRadius: "24px",
    padding: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.75)",
  },

  modalLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: "14px",
    alignItems: "stretch",
  },

  leftPanel: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  rightPanel: {
    background:
      "linear-gradient(180deg, rgba(22,22,22,0.96), rgba(7,7,7,0.96))",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  modalFrameWrap: {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#000",
    boxShadow: "0 18px 42px rgba(0,0,0,0.5)",
  },

  modalIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  },

  infoCard: {
    padding: "22px 26px",
    background:
      "linear-gradient(180deg, rgba(35,35,35,0.72), rgba(14,14,14,0.72))",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.1)",
  },

  modalMainTitle: {
    margin: "0 0 10px 0",
    color: "#fff",
    fontSize: "30px",
    lineHeight: "1.15",
    fontWeight: "900",
  },

  modalOverview: {
    margin: 0,
    color: "#e2e2e2",
    fontSize: "15px",
    lineHeight: "1.55",
  },

  castSection: {
    padding: "10px 12px 12px",
    background:
      "linear-gradient(180deg, rgba(20,20,20,0.82), rgba(8,8,8,0.82))",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
  },

  castHeading: {
    margin: "0 0 8px 0",
    color: "#fff",
    fontSize: "17px",
    fontWeight: "900",
  },

castRow: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: "14px",
},

castCard: {
  minWidth: "135px",
  maxWidth: "135px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "14px",
  overflow: "hidden",
  textAlign: "center",
  flex: "0 0 auto",
  transition: "transform 0.2s ease",
},

castImage: {
  width: "100%",
  height: "170px",
  objectFit: "cover",
  objectPosition: "center 20%",
  display: "block",
},

castPlaceholder: {
  width: "100%",
  height: "140px",
  background: "#222",
  color: "#777",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: "800",
},

  castTextBox: {
    padding: "8px 6px 8px",
  },

castName: {
  margin: "0",
  color: "#fff",
  fontSize: "13px",
  lineHeight: "1.2",
  fontWeight: "900",
},

  castRole: {
    margin: 0,
    color: "#bcbcbc",
    fontSize: "9px",
    lineHeight: "1.1",
  },

  sidebarPoster: {
    width: "100%",
    maxHeight: "420px",
    borderRadius: "14px",
    objectFit: "contain",
    objectPosition: "center",
    background: "#000",
    boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
  },

  sidebarTitle: {
    margin: "6px 0 0",
    color: "#fff",
    fontSize: "25px",
    lineHeight: "1.12",
    fontWeight: "900",
  },

  sidebarMeta: {
    margin: 0,
    color: "#b8b8b8",
    fontSize: "14px",
  },

  sidebarOverview: {
    margin: "4px 0 0",
    color: "#f0f0f0",
    fontSize: "13px",
    lineHeight: "1.45",
  },

  sidebarDivider: {
    height: "1px",
    background: "rgba(255,255,255,0.14)",
    margin: "6px 0",
  },

  factRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    color: "#fff",
    fontSize: "12px",
  },

  factLabel: {
    color: "#f4f4f4",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  factValue: {
    color: "#cfcfcf",
    textAlign: "right",
    lineHeight: "1.3",
  },

  detailsButton: {
    marginTop: "auto",
    textAlign: "center",
    padding: "13px",
    background: "linear-gradient(90deg, #d71920, #e33b2f)",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "12px",
    fontWeight: "900",
    fontSize: "17px",
    boxShadow: "0 12px 30px rgba(229,9,20,0.28)",
  },

  disabledButton: {
    marginTop: "auto",
    padding: "13px",
    background: "#333",
    color: "#999",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "16px",
  },

  loadingText: {
    color: "#bbb",
    fontSize: "14px",
  },

  closeButton: {
    position: "absolute",
    top: "12px",
    right: "14px",
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    fontSize: "30px",
    cursor: "pointer",
    lineHeight: 1,
    zIndex: 2,
    width: "40px",
    height: "40px",
    borderRadius: "999px",
  },
};

export default TrailerRow;