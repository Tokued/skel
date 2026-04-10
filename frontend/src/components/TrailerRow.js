import React, { useEffect, useState } from "react";
import axios from "axios";

const featuredMovies = [
  { title: "Inception", imdbID: "tt1375666" },
  { title: "Interstellar", imdbID: "tt0816692" },
  { title: "The Dark Knight", imdbID: "tt0468569" }
];

const styles = {
  section: {
    marginTop: "20px",
  },

  heading: {
    color: "white",
    marginBottom: "18px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.4)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
  },

  title: {
    fontSize: "15px",
    marginBottom: "10px",
    color: "#f2f2f2",
    fontWeight: "500",
  },

  mediaWrap: {
    position: "relative",
    width: "100%",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#111",
  },

  thumbnail: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
    display: "block",
  },

  playOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(to top, rgba(0,0,0,0.25), rgba(0,0,0,0.1))",
  },

  playButton: {
    width: "68px",
    height: "48px",
    borderRadius: "14px",
    backgroundColor: "rgba(255,0,0,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },

  playTriangle: {
    width: 0,
    height: 0,
    borderTop: "10px solid transparent",
    borderBottom: "10px solid transparent",
    borderLeft: "16px solid white",
    marginLeft: "3px",
  },

  iframe: {
    width: "100%",
    height: "220px",
    border: "none",
    display: "block",
  },

  noTrailer: {
    color: "#bdbdbd",
    fontSize: "14px",
    padding: "20px 0",
  },
};

function TrailerRow() {
  const [trailers, setTrailers] = useState([]);
  const [activeTrailer, setActiveTrailer] = useState(null);

  useEffect(() => {
    const fetchTrailers = async () => {
      try {
        const results = await Promise.all(
          featuredMovies.map(async (movie) => {
            const res = await axios.get(
              `http://localhost:8081/trailers/${movie.imdbID}`
            );

            return {
              title: movie.title,
              youtubeId: res.data.youtubeId || null,
            };
          })
        );

        setTrailers(results);
      } catch (error) {
        console.error("Error fetching trailers:", error);
      }
    };

    fetchTrailers();
  }, []);

  return (
    <div style={styles.section}>
      <h2 style={styles.heading}>Featured Trailers</h2>

      <div style={styles.grid}>
        {trailers.map((movie, index) => {
          const isPlaying = activeTrailer === movie.youtubeId;

          return (
            <div
              key={index}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 6px 15px rgba(0,0,0,0.4)";
              }}
            >
              <h3 style={styles.title}>{movie.title}</h3>

              {movie.youtubeId ? (
                <div style={styles.mediaWrap}>
                  {isPlaying ? (
                    <iframe
                      style={styles.iframe}
                      src={`https://www.youtube.com/embed/${movie.youtubeId}?autoplay=1&modestbranding=1&rel=0`}
                      title={movie.title}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <div onClick={() => setActiveTrailer(movie.youtubeId)}>
                      <img
                        src={`https://img.youtube.com/vi/${movie.youtubeId}/maxresdefault.jpg`}
                        alt={`${movie.title} trailer thumbnail`}
                        style={styles.thumbnail}
                        onError={(e) => {
                          e.currentTarget.src = `https://img.youtube.com/vi/${movie.youtubeId}/hqdefault.jpg`;
                        }}
                      />
                      <div style={styles.playOverlay}>
                        <div style={styles.playButton}>
                          <div style={styles.playTriangle}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={styles.noTrailer}>No trailer found</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrailerRow;
// hello