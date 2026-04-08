import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import getUserInfo from "../utilities/decodeJwt";
import { Link, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
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

  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  // 🔍 SEARCH FUNCTION
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
    await searchMovies();

    if (searchQuery.trim()) {
      navigate(`/home?query=${encodeURIComponent(searchQuery)}`);
    }
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

              <Form.Select
                className="vmdb-search-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Movies">Movies</option>
                <option value="Series">Series</option>
              </Form.Select>

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