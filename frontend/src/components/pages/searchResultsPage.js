import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const query = params.get("query") || "";
  const category = params.get("category") || "All";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await axios.get(
          `https://www.omdbapi.com/?apikey=1d0ab4bc&s=${query}`
        );

        let formatted = [];

        if (res.data.Search) {
          formatted = res.data.Search
            .filter((movie) => movie.Type === "movie" || movie.Type === "series")
            .map((movie) => ({
              id: movie.imdbID,
              title: movie.Title,
              year: movie.Year,
              poster: movie.Poster,
              type: movie.Type,
            }));

          if (category === "Movies") {
            formatted = formatted.filter((m) => m.type === "movie");
          } else if (category === "Series") {
            formatted = formatted.filter((m) => m.type === "series");
          }
        }

        setResults(formatted);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, category]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Search results for "{query}"</h1>

        {loading ? (
          <p style={styles.message}>Loading...</p>
        ) : results.length === 0 ? (
          <p style={styles.message}>No results found.</p>
        ) : (
          <div style={styles.grid}>
            {results.map((movie) => (
              <div
                key={movie.id}
                style={styles.card}
                onClick={() => navigate(`/movies/${movie.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {movie.poster && movie.poster !== "N/A" ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    style={styles.poster}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={styles.noPoster}>No Image</div>
                )}

                <div style={styles.cardContent}>
                  <h3 style={styles.title}>{movie.title}</h3>
                  <p style={styles.subtitle}>
                    {movie.year} • {movie.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: "#0f0f0f",
    minHeight: "100vh",
    color: "white",
    padding: "30px",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "36px",
    marginBottom: "30px",
  },
  message: {
    fontSize: "18px",
    color: "#bdbdbd",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  poster: {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    display: "block",
  },
  noPoster: {
    width: "100%",
    height: "300px",
    backgroundColor: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ccc",
  },
  cardContent: {
    padding: "12px",
  },
  title: {
    fontSize: "18px",
    marginBottom: "8px",
    color: "#fff",
  },
  subtitle: {
    fontSize: "14px",
    color: "#aaa",
  },
};

export default SearchResultsPage;