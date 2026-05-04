import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import ReactNavbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import logo from "../assets/vmdb-logo.png";
import "../css/Navbar.css";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [filterError, setFilterError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [aiMode, setAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiError, setAiError] = useState("");

  const navigate = useNavigate();
  const searchRef = useRef(null);
  const filterRef = useRef(null);

  const activeError = filterError || searchError;

  const searchMovies = useCallback(async () => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSearchResults([]);
      setShowDropdown(false);
      return [];
    }

    try {
      const res = await axios.get("https://api.themoviedb.org/3/search/multi", {
        params: {
          api_key: TMDB_API_KEY,
          query: trimmed,
          include_adult: false,
          language: "en-US",
          page: 1,
        },
      });

      const rawResults = res.data?.results || [];

      const filtered = rawResults
        .filter(
          (item) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            item.poster_path
        )
        .slice(0, 10);

      const enrichedResults = await Promise.all(
        filtered.map(async (item) => {
          try {
            const mediaType = item.media_type;

            const externalIdsRes = await axios.get(
              `https://api.themoviedb.org/3/${mediaType}/${item.id}/external_ids`,
              {
                params: {
                  api_key: TMDB_API_KEY,
                },
              }
            );

            const imdbID = externalIdsRes.data?.imdb_id;
            if (!imdbID) return null;

            return {
              id: imdbID,
              title: item.title || item.name || "Untitled",
              year:
                mediaType === "movie"
                  ? item.release_date
                    ? item.release_date.slice(0, 4)
                    : "N/A"
                  : item.first_air_date
                  ? item.first_air_date.slice(0, 4)
                  : "N/A",
              poster: item.poster_path
                ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                : "N/A",
              type: mediaType === "movie" ? "movie" : "series",
              popularity: item.popularity || 0,
            };
          } catch {
            return null;
          }
        })
      );

      const formatted = enrichedResults
        .filter(Boolean)
        .sort((a, b) => {
          const query = trimmed.toLowerCase();
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();

          const aStarts = aTitle.startsWith(query) ? 1 : 0;
          const bStarts = bTitle.startsWith(query) ? 1 : 0;

          const aIncludes = aTitle.includes(query) ? 1 : 0;
          const bIncludes = bTitle.includes(query) ? 1 : 0;

          if (aStarts !== bStarts) return bStarts - aStarts;
          if (aIncludes !== bIncludes) return bIncludes - aIncludes;
          if (a.popularity !== b.popularity) return b.popularity - a.popularity;

          return aTitle.localeCompare(bTitle);
        })
        .slice(0, 6);

      if (formatted.length === 0) {
        setSearchResults([]);
        setShowDropdown(false);
        return [];
      }

      setSearchResults(formatted);
      setShowDropdown(true);
      setSearchError("");
      return formatted;
    } catch (err) {
      console.error("Navbar TMDb search error:", err);
      setSearchResults([]);
      setShowDropdown(false);
      return [];
    }
  }, [searchQuery]);

  const years = [];
  for (let y = 2026; y >= 1900; y--) {
    years.push(String(y));
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      if (!aiMode && searchQuery.trim()) {
        if (searchError === "Type a movie or show title in the search bar.") {
          setSearchError("");
        }
        searchMovies();
      } else if (!aiMode) {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, searchMovies, searchError, aiMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        // Filter dropdown will close automatically via Bootstrap
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchError("Type a movie or show title in the search bar.");
      return;
    }

    setSearchError("");
    setFilterError("");
    setShowDropdown(false);
    navigate(`/search?query=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();

    const trimmedQuery = aiQuery.trim();

    if (!trimmedQuery) {
      setAiError("Describe what you want to watch.");
      return;
    }

    setAiError("");
    setAiMode(false);
    setAiQuery("");
    navigate(`/ai-results?description=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleApplyFilters = () => {
    const isAllSelected =
      selectedCategory === "All" &&
      !selectedYear &&
      !selectedGenre;

    if (isAllSelected) {
      setFilterError("Choose at least one filter.");
      return;
    }

    setFilterError("");
    setSearchError("");

    const params = new URLSearchParams();

    if (selectedCategory && selectedCategory !== "All") {
      params.set("category", selectedCategory);
    }

    if (selectedYear) {
      params.set("year", selectedYear);
    }

    if (selectedGenre) {
      params.set("genre", selectedGenre);
    }

    navigate(`/search?${params.toString()}`);
  };

  return (
    <ReactNavbar bg="transparent" variant="dark" expand="lg" className="vmdb-navbar">
      <Container fluid className="vmdb-navbar-container">
        {/* ──────────────────── LEFT SECTION ──────────────────── */}
        <div className="vmdb-navbar-left">
          <Link to="/home" className="vmdb-logo-link">
            <img src={logo} alt="VMDB logo" className="vmdb-logo" />
          </Link>

          <NavDropdown title="☰ Menu" menuVariant="dark">
            <NavDropdown.Item as={Link} to="/privateUserProfile">
              Profile
            </NavDropdown.Item>

            <NavDropdown.Item as={Link} to="/watchlist">
              Watchlist
            </NavDropdown.Item>

            <NavDropdown.Item as={Link} to="/">
              Register
            </NavDropdown.Item>
            
            <NavDropdown.Item as={Link} to="/movie-akinator">
              Movie Akinator
            </NavDropdown.Item>

            <NavDropdown.Item as={Link} to="/admin">
              🛠 Admin Panel
            </NavDropdown.Item>
          </NavDropdown>
        </div>

        {/* ──────────────────── CENTER SECTION (Search) ──────────────────── */}
        <div className="vmdb-navbar-center" ref={searchRef}>
          {/* ════════════════════════════════
              NORMAL SEARCH MODE
          ════════════════════════════════ */}
          {!aiMode && (
            <Form className="vmdb-search-form" onSubmit={handleSearchSubmit}>
              {showDropdown && searchResults.length > 0 && (
                <div className="vmdb-suggestions-dropdown">
                  {searchResults.map((movie) => (
                    <div
                      key={movie.id}
                      className="vmdb-suggestion-item"
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchError("");
                        setFilterError("");
                        navigate(`/movies/${movie.id}`);
                      }}
                    >
                      {movie.poster !== "N/A" ? (
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="vmdb-suggestion-poster"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="vmdb-suggestion-no-poster">No Image</div>
                      )}

                      <div className="vmdb-suggestion-text">
                        <div className="vmdb-suggestion-title">{movie.title}</div>
                        <div className="vmdb-suggestion-subtitle">
                          {movie.year} • {movie.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <InputGroup>
                {/* FILTERS BUTTON */}
                <div ref={filterRef}>
                  <NavDropdown
                    id="filters-dropdown"
                    title="⚙ Filters"
                    menuVariant="dark"
                    className="vmdb-filters-btn-wrapper"
                  >
                    <div className="vmdb-filters-dropdown">
                      <div className="vmdb-filter-group">
                        <label className="vmdb-filter-label">Type</label>
                        <Form.Select
                          className="vmdb-filter-select"
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setFilterError("");
                          }}
                        >
                          <option value="All">All</option>
                          <option value="Movies">Movies</option>
                          <option value="Series">TV Shows</option>
                        </Form.Select>
                      </div>

                      <div className="vmdb-filter-group">
                        <label className="vmdb-filter-label">Released</label>
                        <Form.Select
                          className="vmdb-filter-select"
                          value={selectedYear}
                          onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setFilterError("");
                          }}
                        >
                          <option value="">All Years</option>
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Form.Select>
                      </div>

                      <div className="vmdb-filter-group">
                        <label className="vmdb-filter-label">Genre</label>
                        <Form.Select
                          className="vmdb-filter-select"
                          value={selectedGenre}
                          onChange={(e) => {
                            setSelectedGenre(e.target.value);
                            setFilterError("");
                          }}
                        >
                          <option value="">All Genres</option>
                          <option value="Action">Action</option>
                          <option value="Comedy">Comedy</option>
                          <option value="Drama">Drama</option>
                          <option value="Horror">Horror</option>
                          <option value="Romance">Romance</option>
                          <option value="Thriller">Thriller</option>
                        </Form.Select>
                      </div>

                      <Button
                        className="vmdb-apply-filters-btn"
                        onClick={handleApplyFilters}
                      >
                        ✓ Apply Filters
                      </Button>

                      {filterError && (
                        <div style={{ color: "#ff6b6b", fontSize: "12px", marginTop: "8px", textAlign: "center" }}>
                          {filterError}
                        </div>
                      )}
                    </div>
                  </NavDropdown>
                </div>

                {/* SEARCH INPUT */}
                <Form.Control
                  type="text"
                  placeholder={activeError || "Search VMDB"}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError !== "Type a movie or show title in the search bar.") {
                      setSearchError("");
                    }
                  }}
                  className={`vmdb-search-input ${activeError ? "error" : ""}`}
                />

                {/* AI TOGGLE BUTTON */}
                <Button
                  type="button"
                  className="vmdb-ai-toggle-btn"
                  onClick={() => {
                    setAiMode(true);
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowDropdown(false);
                    setSearchError("");
                    setFilterError("");
                  }}
                  title="Switch to AI description search"
                >
                  ✨ AI
                </Button>

                {/* SEARCH BUTTON */}
                <Button type="submit" className="vmdb-search-btn">
                  🔍
                </Button>
              </InputGroup>
            </Form>
          )}

          {/* ════════════════════════════════
              AI SEARCH MODE
          ════════════════════════════════ */}
          {aiMode && (
            <Form className="vmdb-search-form" onSubmit={handleAiSubmit}>
              <InputGroup>
                {/* AI INPUT */}
                <Form.Control
                  type="text"
                  autoFocus
                  placeholder={aiError || "Describe a vibe, plot, or feeling…"}
                  value={aiQuery}
                  onChange={(e) => {
                    setAiQuery(e.target.value);
                    setAiError("");
                  }}
                  className={`vmdb-search-input vmdb-ai-input ${aiError ? "error" : ""}`}
                />

                {/* EXIT AI MODE */}
                <Button
                  type="button"
                  className="vmdb-ai-toggle-btn vmdb-ai-toggle-active"
                  onClick={() => {
                    setAiMode(false);
                    setAiQuery("");
                    setAiError("");
                  }}
                  title="Back to normal search"
                >
                  ✕ AI
                </Button>

                {/* SEARCH BUTTON */}
                <Button type="submit" className="vmdb-search-btn">
                  🔍
                </Button>
              </InputGroup>
            </Form>
          )}
        </div>
      </Container>
    </ReactNavbar>
  );
}
