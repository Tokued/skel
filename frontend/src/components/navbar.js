import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import getUserInfo from "../utilities/decodeJwt";
import { Link, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import ReactNavbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import logo from "../assets/vmdb-logo.png";
import "../css/Navbar.css";

export default function Navbar() {
  const [user, setUser] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  const years = [];
  for (let y = 2026; y >= 1900; y--) {
    years.push(String(y));
  }

  // 🔍 SEARCH FUNCTION
  const searchMovies = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return [];
    }

    try {
      const res = await axios.get(
        `https://www.omdbapi.com/?apikey=1d0ab4bc&s=${encodeURIComponent(searchQuery)}`
      );

      if (res.data.Search) {
        let formatted = res.data.Search
          .filter((movie) => movie.Type === "movie" || movie.Type === "series")
          .map((movie) => ({
            id: movie.imdbID,
            title: movie.Title,
            year: movie.Year,
            poster: movie.Poster,
            type: movie.Type,
          }));

        if (selectedCategory === "Movies") {
          formatted = formatted.filter((m) => m.type === "movie");
        } else if (selectedCategory === "Series") {
          formatted = formatted.filter((m) => m.type === "series");
        }

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

  // 🔁 LIVE SEARCH
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
  }, [searchQuery, selectedCategory]);

  // 🖱 CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔘 SUBMIT SEARCH
  const handleSearchSubmit = async (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("query", searchQuery.trim());
    }

    if (selectedCategory && selectedCategory !== "All") {
      params.set("category", selectedCategory);
    }

    if (selectedGenre) {
      params.set("genre", selectedGenre);
    }

    if (selectedYear) {
      params.set("year", selectedYear);
    }

    if ([...params.keys()].length === 0) return;

    setShowDropdown(false);
    navigate(`/search?${params.toString()}`);
  };

  // 🎬 CLICK MOVIE
  const handleMovieClick = (movieId) => {
    setShowDropdown(false);
    navigate(`/movies/${movieId}`);
  };

  return (
    <ReactNavbar bg="dark" variant="dark" expand="lg" className="vmdb-navbar">
      <Container fluid className="vmdb-navbar-container">
        {/* LEFT */}
        <div className="vmdb-navbar-left">
          <Link to="/home" className="vmdb-logo-link">
            <img src={logo} alt="VMDB logo" className="vmdb-logo" />
          </Link>

          <NavDropdown
            title="☰ Menu"
            id="vmdb-menu-dropdown"
            menuVariant="dark"
            className="vmdb-menu-dropdown"
          >
            <NavDropdown.Item as={Link} to="/privateUserProfile">
              Profile
            </NavDropdown.Item>

            <NavDropdown.Item as={Link} to="/watchlist">
              Watchlist
            </NavDropdown.Item>

            <NavDropdown.Item as={Link} to="/">
              Register
            </NavDropdown.Item>
          </NavDropdown>
        </div>

        {/* CENTER SEARCH */}
        <div className="vmdb-navbar-center" ref={searchRef}>
          <Form className="vmdb-search-form" onSubmit={handleSearchSubmit}>
            <InputGroup>
              <NavDropdown
                title="Filters"
                id="vmdb-filters-dropdown"
                menuVariant="dark"
                className="vmdb-menu-dropdown vmdb-filters-button"
              >
                <div style={styles.filterMenu}>
                  <div style={styles.filterGroup}>
                    <div style={styles.filterLabel}>Type</div>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={styles.select}
                    >
                      <option value="All">All</option>
                      <option value="Movies">Movies</option>
                      <option value="Series">TV Shows</option>
                    </Form.Select>
                  </div>

                  <div style={styles.filterGroup}>
                    <div style={styles.filterLabel}>Released</div>
                    <Form.Select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">All Years</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  <div style={styles.filterGroup}>
                    <div style={styles.filterLabel}>Genre</div>
                    <Form.Select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">All Genres</option>
                      <option value="Action">Action</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Animation">Animation</option>
                      <option value="Comedy">Comedy</option>
                      <option value="Crime">Crime</option>
                      <option value="Documentary">Documentary</option>
                      <option value="Drama">Drama</option>
                      <option value="Family">Family</option>
                      <option value="Fantasy">Fantasy</option>
                      <option value="History">History</option>
                      <option value="Horror">Horror</option>
                      <option value="Music">Music</option>
                      <option value="Mystery">Mystery</option>
                      <option value="Romance">Romance</option>
                      <option value="Science Fiction">Science Fiction</option>
                      <option value="TV Movie">TV Movie</option>
                      <option value="Thriller">Thriller</option>
                      <option value="War">War</option>
                      <option value="Western">Western</option>
                    </Form.Select>
                  </div>
                </div>
              </NavDropdown>

              <Form.Control
                type="text"
                placeholder="Search VMDB"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim() && searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                className="vmdb-search-input"
              />

              <Button type="submit" variant="light" className="vmdb-search-button">
                Search
              </Button>
            </InputGroup>
          </Form>

          {/* DROPDOWN */}
          {showDropdown && searchResults.length > 0 && (
            <div className="vmdb-suggestions-dropdown">
              {searchResults.slice(0, 6).map((movie) => (
                <div
                  key={movie.id}
                  className="vmdb-suggestion-item"
                  onClick={() => handleMovieClick(movie.id)}
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
        </div>
      </Container>
    </ReactNavbar>
  );
}

const styles = {
  filterMenu: {
    padding: "12px",
    minWidth: "240px",
  },
  filterGroup: {
    marginBottom: "12px",
  },
  filterLabel: {
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#fff",
  },
  select: {
    minWidth: "100%",
    backgroundColor: "#1b1b1b",
    color: "white",
    border: "1px solid #333",
  },
  
};
