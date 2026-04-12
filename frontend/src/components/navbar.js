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

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const navigate = useNavigate();
  const searchRef = useRef(null);

  const searchMovies = useCallback(async () => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSearchResults([]);
      setShowDropdown(false);
      return [];
    }

    try {
      const res = await axios.get("https://www.omdbapi.com/", {
        params: {
          apikey: "1d0ab4bc",
          s: trimmed,
        },
      });

      if (res.data.Response === "False" || !res.data.Search) {
        setSearchResults([]);
        setShowDropdown(false);
        return [];
      }

      const formatted = res.data.Search
        .filter((movie) => movie.Type === "movie" || movie.Type === "series")
        .map((movie) => ({
          id: movie.imdbID,
          title: movie.Title,
          year: movie.Year,
          poster: movie.Poster,
          type: movie.Type,
        }));

      setSearchResults(formatted);
      setShowDropdown(true);
      return formatted;
    } catch (err) {
      console.error("Navbar OMDb search error:", err);
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
      if (searchQuery.trim()) {
        setSearchError("");
        searchMovies();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, searchMovies]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
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
    setShowDropdown(false);
    navigate(`/search?query=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleApplyFilters = () => {
    setShowDropdown(false);

    const isAllSelected =
      selectedCategory === "All" &&
      !selectedYear &&
      !selectedGenre;

    if (isAllSelected) {
      setSearchError("Choose at least one filter.");
      return;
    }

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
    <ReactNavbar bg="dark" variant="dark" expand="lg" className="vmdb-navbar">
      <Container fluid className="vmdb-navbar-container">
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

            <NavDropdown.Item as={Link} to="/admin">
              🛠 Admin Panel
            </NavDropdown.Item>
          </NavDropdown>
        </div>

        <div className="vmdb-navbar-center" ref={searchRef}>
          <Form className="vmdb-search-form" onSubmit={handleSearchSubmit}>
            <InputGroup>
              <NavDropdown title="Filters" menuVariant="dark">
                <div style={styles.filterMenu}>
                  <div style={styles.filterGroup}>
                    <div style={styles.filterLabel}>Type</div>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSearchError("");
                      }}
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
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setSearchError("");
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

                  <div style={styles.filterGroup}>
                    <div style={styles.filterLabel}>Genre</div>
                    <Form.Select
                      value={selectedGenre}
                      onChange={(e) => {
                        setSelectedGenre(e.target.value);
                        setSearchError("");
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
                    variant="light"
                    size="sm"
                    onClick={handleApplyFilters}
                    style={styles.applyButton}
                  >
                    ✓ Apply Filters
                  </Button>
                </div>
              </NavDropdown>

              <Form.Control
                type="text"
                placeholder={searchError || "Search VMDB"}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError("");
                }}
                className={`vmdb-search-input ${searchError ? "error" : ""}`}
              />

              <Button type="submit" variant="light">
                Search
              </Button>
            </InputGroup>
          </Form>
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
  applyButton: {
    width: "100%",
    marginTop: "8px",
  },
};