import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import getUserInfo from "../../utilities/decodeJwt";

const topMoviesSeed = [
  { id: "tt15398776", title: "Oppenheimer", year: "2023" },
  { id: "tt1517268", title: "Barbie", year: "2023" },
  { id: "tt9362722", title: "Spider-Man: Across the Spider-Verse", year: "2023" },
  { id: "tt0816692", title: "Interstellar", year: "2014" },
  { id: "tt0468569", title: "The Dark Knight", year: "2008" },
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [submittedResults, setSubmittedResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [user, setUser] = useState(null);
  const [topMovies, setTopMovies] = useState(topMoviesSeed);

  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  useEffect(() => {
    const fetchTopMoviePosters = async () => {
      try {
        const results = await Promise.all(
          topMoviesSeed.map(async (movie) => {
            try {
              const res = await axios.get(
                `https://www.omdbapi.com/?apikey=1d0ab4bc&i=${movie.id}`
              );

              return {
                ...movie,
                poster:
                  res.data && res.data.Poster && res.data.Poster !== "N/A"
                    ? res.data.Poster
                    : null,
              };
            } catch {
              return { ...movie, poster: null };
            }
          })
        );

        setTopMovies(results);
      } catch (err) {
        console.error("Error loading top movie posters:", err);
      }
    };

    fetchTopMoviePosters();
  }, []);

  const searchMovies = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return [];
    }

    try {
      const res = await axios.get(
        `https://www.omdbapi.com/?apikey=1d0ab4bc&s=${searchQuery}`
      );

      if (res.data.Search) {
        const formatted = res.data.Search.map((movie) => ({
          id: movie.imdbID,
          title: movie.Title,
          year: movie.Year,
          poster: movie.Poster,
        }));

        setSearchResults(formatted);
        setShowDropdown(true);
        return formatted;
      } else {
        setSearchResults([]);
        setShowDropdown(false);
        return [];
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
      setShowDropdown(false);
      return [];
    }
  };

  const handleSearchSubmit = async () => {
    const results = await searchMovies();
    setSubmittedResults(results);
    setHasSearched(true);
    setShowDropdown(results.length > 0);
  };

  const handleAddToWatchlist = async (movie) => {
    if (!user?.id) {
      alert("Please log in to add movies to your watchlist.");
      return;
    }

    try {
      await axios.post("http://localhost:8081/watchlist/add", {
        userId: user.id,
        movieId: movie.id,
        title: movie.title,
      });

      alert("Added to watchlist");
    } catch (err) {
      console.error("Watchlist add error:", err);
      alert(err.response?.data?.message || "Error adding to watchlist");
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.trim()) {
        searchMovies();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMovieClick = (movieId) => {
    setShowDropdown(false);
    navigate(`/movies/${movieId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>VMDB</h1>
        <p style={styles.subtitle}>
          Search movies, explore titles, and manage your watchlist all in one place.
        </p>
      </div>

      <div style={styles.searchWrapper} ref={searchRef}>
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim() && searchResults.length > 0) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchSubmit();
              }
            }}
            style={styles.input}
          />

          <button onClick={handleSearchSubmit} style={styles.searchButton}>
            Search
          </button>
        </div>

        {showDropdown && searchResults.length > 0 && (
          <div style={styles.dropdown}>
            {searchResults.slice(0, 6).map((movie) => (
              <div
                key={movie.id}
                style={styles.dropdownItem}
                onClick={() => handleMovieClick(movie.id)}
              >
                {movie.poster !== "N/A" ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    style={styles.dropdownPoster}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={styles.dropdownNoPoster}>No Image</div>
                )}

                <div style={styles.dropdownText}>
                  <div style={styles.dropdownTitle}>{movie.title}</div>
                  <div style={styles.dropdownYear}>{movie.year}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasSearched ? (
        <div>
          <h3 style={styles.sectionTitle}>Search Results</h3>
          <div style={styles.grid}>
            {submittedResults.map((movie) => (
              <div
                key={movie.id}
                style={styles.card}
                onClick={() => navigate(`/movies/${movie.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {movie.poster !== "N/A" ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    style={styles.poster}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={styles.noPoster}>No Image</div>
                )}

                <div style={styles.cardContent}>
                  <h4 style={styles.movieTitle}>{movie.title}</h4>
                  <p style={styles.year}>{movie.year}</p>
                  <p style={styles.viewText}>Click to view details</p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToWatchlist(movie);
                    }}
                    style={styles.watchlistButton}
                  >
                    Add to Watchlist
                  </button>
                </div>
              </div>
            ))}
          </div>

          {submittedResults.length === 0 && (
            <div style={styles.emptyState}>
              <h3>No results found</h3>
              <p>Try searching for another movie title.</p>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <h3>Find your next movie</h3>
          <p>Search for a title like Batman, Interstellar, or Spider-Man.</p>
        </div>
      )}

      <div style={styles.topMoviesSection}>
        <h2 style={styles.sectionTitle}>Top Picks</h2>
        <p style={styles.topMoviesSubtitle}>Popular movies to get you started</p>

        <div style={styles.scrollRow}>
          {topMovies.map((movie) => (
            <div
              key={movie.id}
              style={styles.topMovieCard}
              onClick={() => navigate(`/movies/${movie.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {movie.poster ? (
                <img
                  src={movie.poster}
                  alt={movie.title}
                  style={styles.topMoviePoster}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div style={styles.noTopPoster}>No Image</div>
              )}

              <div style={styles.cardContent}>
                <h4 style={styles.movieTitle}>{movie.title}</h4>
                <p style={styles.year}>{movie.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1100px",
    margin: "0 auto",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#0f0f0f",
  },

  hero: {
    marginBottom: "30px",
    textAlign: "center",
    padding: "30px 20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
  },

  title: {
    fontSize: "48px",
    marginBottom: "10px",
    color: "#ffffff",
  },

  subtitle: {
    fontSize: "18px",
    color: "#cfcfcf",
    maxWidth: "700px",
    margin: "0 auto",
  },

  searchWrapper: {
    position: "relative",
    marginBottom: "30px",
    overflow: "visible",
  },

  searchBar: {
    display: "flex",
    gap: "10px",
  },

  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    outline: "none",
    fontSize: "16px",
    backgroundColor: "#1f1f1f",
    color: "white",
  },

  searchButton: {
    padding: "12px 18px",
    backgroundColor: "#2f2f2f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "10px",
    marginTop: "8px",
    overflow: "hidden",
    zIndex: 9999,
    boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
  },

  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #2a2a2a",
  },

  dropdownPoster: {
    width: "45px",
    height: "65px",
    objectFit: "cover",
    borderRadius: "6px",
  },

  dropdownNoPoster: {
    width: "45px",
    height: "65px",
    backgroundColor: "#333",
    color: "#ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    borderRadius: "6px",
  },

  dropdownText: {
    display: "flex",
    flexDirection: "column",
  },

  dropdownTitle: {
    fontSize: "15px",
    color: "white",
  },

  dropdownYear: {
    fontSize: "12px",
    color: "#aaa",
  },

  sectionTitle: {
    marginBottom: "15px",
    color: "#e0e0e0",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    overflow: "hidden",
    transition: "transform 0.2s",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
  },

  poster: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
  },

  noPoster: {
    height: "260px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    color: "#ccc",
  },

  noTopPoster: {
    width: "100%",
    height: "260px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    color: "#ccc",
  },

  cardContent: {
    padding: "12px",
    textAlign: "center",
  },

  movieTitle: {
    fontSize: "16px",
    marginBottom: "6px",
    color: "#fff",
  },

  year: {
    fontSize: "13px",
    color: "#aaa",
    marginBottom: "8px",
  },

  viewText: {
    fontSize: "12px",
    color: "#888",
  },

  watchlistButton: {
    marginTop: "10px",
    padding: "8px 12px",
    border: "none",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    backgroundColor: "#e50914",
  },

  emptyState: {
    textAlign: "center",
    marginTop: "50px",
    color: "#bbb",
    backgroundColor: "#1a1a1a",
    padding: "30px",
    borderRadius: "16px",
  },

  topMoviesSection: {
    marginTop: "50px",
  },

  topMoviesSubtitle: {
    color: "#aaa",
    marginBottom: "15px",
  },

  scrollRow: {
    display: "flex",
    gap: "18px",
    overflowX: "auto",
    paddingBottom: "12px",
    scrollbarWidth: "thin",
  },

  topMovieCard: {
    minWidth: "180px",
    maxWidth: "180px",
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    flexShrink: 0,
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  topMoviePoster: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
  },
};

export default HomePage;