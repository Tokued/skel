import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router-dom";
import getUserInfo from "../../utilities/decodeJwt";
import axios from "axios";

const PrivateUserProfile = () => {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState(null);

  const [watchlist, setWatchlist] = useState([]);
  const [mergedMovies, setMergedMovies] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [avatarOptions, setAvatarOptions] = useState([]);
  const savedAvatar = localStorage.getItem("profileAvatar");

  const backgroundOptions = [
    "/backgrounds/AmbiantPink.jpg",
    "/backgrounds/DistopiaPurple - Copy.avif",
    "/backgrounds/GradiantGray.jpg",
    "/backgrounds/SpaceRanger.jpg",
  ];

  const savedBackground = localStorage.getItem("profileBackground");

  const navigate = useNavigate();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const selectAvatar = (img) => {
    localStorage.setItem("profileAvatar", img);
    window.location.reload();
  };

  const selectBackground = (img) => {
    localStorage.setItem("profileBackground", img);
    window.location.reload();
  };

  // ⭐ FIXED: Base64 Upload for Avatar
  const uploadCustomAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      localStorage.setItem("profileAvatar", reader.result);
      window.location.reload();
    };
    reader.readAsDataURL(file);
  };

  // ⭐ FIXED: Base64 Upload for Background
  const uploadCustomBackground = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      localStorage.setItem("profileBackground", reader.result);
      window.location.reload();
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const u = getUserInfo();
    setUser(u);

    if (u?.id) {
      axios
        .get(`http://localhost:8081/watchlist/${u.id}`)
        .then(async (res) => {
          const raw = res.data;
          setWatchlist(raw);

          const movieDetails = await Promise.all(
            raw.map((m) =>
              axios.get(`http://localhost:8081/movies/${m.movieId}`)
            )
          );

          const merged = movieDetails.map((r, i) => ({
            ...raw[i],
            ...r.data,
          }));

          setMergedMovies(merged);
        })
        .catch(() => {});

      axios
        .get(`http://localhost:8081/reviews/user/${u.id}`)
        .then((res) => setReviews(res.data.reviews || []))
        .catch(() => {});
    }

    axios
      .get(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=3bf09ebe175944f8ba507cce0c7e6149`
      )
      .then((res) => {
        const posters = res.data.results
          .filter((m) => m.poster_path)
          .slice(0, 12)
          .map(
            (m) => `https://image.tmdb.org/t/p/w500${m.poster_path}`
          );

        setAvatarOptions(posters);
      })
      .catch(() => {});
  }, []);

  if (!user) return <h4 className="text-center mt-5">Log in to view this page.</h4>;

  // ⭐ Stats (NOW ACCURATE)
  const totalMovies = mergedMovies.length;
  const watched = mergedMovies.filter((m) => m.watched).length;
  const favorites = mergedMovies.filter((m) => m.favorite).length;

  const rated = mergedMovies.filter((m) => m.rating);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((a, b) => a + b.rating, 0) / rated.length).toFixed(1)
      : "N/A";

  const totalReviews = reviews.length;

  // ⭐ BADGES (NOW ACCURATE)
  const badges = [];

  if (watched >= 1) badges.push({ label: "🍿 Movie Newbie", desc: "Watched your first movie" });
  if (watched >= 10) badges.push({ label: "🎬 Film Enthusiast", desc: "Watched 10 movies" });

  if (favorites >= 5) badges.push({ label: "💖 Favorite Collector", desc: "Added 5 favorites" });

  if (totalReviews >= 1) badges.push({ label: "📝 Reviewer", desc: "Wrote your first review" });
  if (totalReviews >= 5) badges.push({ label: "🎞️ Critic", desc: "Wrote 5 reviews" });

  if (rated.length >= 5) badges.push({ label: "⭐ Rating Machine", desc: "Rated 5 movies" });

  // ⭐ Navigation buttons
  const goToWatchlist = () => navigate("/watchlist");
  const goToFavorites = () => navigate("/favorites");
  const goToReviews = () => navigate("/reviews");

  return (
    <div
      className="container text-center mt-5 text-white"
      style={{
        maxWidth: "900px",
        backgroundImage: savedBackground ? `url(${savedBackground})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 0 20px rgba(0,0,0,0.6)",
      }}
    >
      {/* ⭐ Profile Picture */}
      <div className="text-center mb-4">
        <img
          src={savedAvatar || "/avatars/default.jpg"}
          alt="profile avatar"
          style={{
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid #cc5c99",
            marginBottom: "15px",
            boxShadow: "0 0 15px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      <h1 className="mb-4 fw-bold">{user.username}</h1>

      {/* ⭐ Avatar Selector */}
      <h4 className="text-center mb-3" style={{ color: "#cc5c99" }}>
        Choose Your Avatar
      </h4>

      <div
        className="d-flex justify-content-center flex-wrap gap-3 mb-3"
        style={{
          background: "rgba(0,0,0,0.55)",
          padding: "20px",
          borderRadius: "12px",
          backdropFilter: "blur(6px)",
        }}
      >
        {avatarOptions.map((img) => (
          <img
            key={img}
            src={img}
            alt="avatar option"
            onClick={() => selectAvatar(img)}
            style={{
              width: "80px",
              height: "120px",
              borderRadius: "10px",
              objectFit: "cover",
              cursor: "pointer",
              border:
                savedAvatar === img
                  ? "3px solid #cc5c99"
                  : "2px solid transparent",
              transition: "0.2s",
              boxShadow: "0 0 10px rgba(0,0,0,0.4)",
            }}
          />
        ))}
      </div>

      {/* ⭐ Upload Custom Avatar */}
      <div className="mt-3 mb-5">
        <label
          style={{
            background: "#cc5c99",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            color: "white",
            fontWeight: "bold",
          }}
        >
          Upload Your Own Profile Picture
          <input
            type="file"
            accept="image/*"
            onChange={uploadCustomAvatar}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* ⭐ Background Selector */}
      <h4 className="text-center mb-3" style={{ color: "#cc5c99" }}>
        Choose Your Background
      </h4>

      <div
        className="d-flex justify-content-center flex-wrap gap-3 mb-3"
        style={{
          background: "rgba(0,0,0,0.55)",
          padding: "20px",
          borderRadius: "12px",
          backdropFilter: "blur(6px)",
        }}
      >
        {backgroundOptions.map((img) => (
          <img
            key={img}
            src={img}
            alt="background option"
            onClick={() => selectBackground(img)}
            style={{
              width: "150px",
              height: "90px",
              borderRadius: "10px",
              objectFit: "cover",
              cursor: "pointer",
              border:
                savedBackground === img
                  ? "3px solid #cc5c99"
                  : "2px solid transparent",
              transition: "0.2s",
              boxShadow: "0 0 10px rgba(0,0,0,0.4)",
            }}
          />
        ))}
      </div>

      {/* ⭐ Upload Custom Background */}
      <div className="mt-3 mb-5">
        <label
          style={{
            background: "#cc5c99",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            color: "white",
            fontWeight: "bold",
          }}
        >
          Upload Your Own Background
          <input
            type="file"
            accept="image/*"
            onChange={uploadCustomBackground}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* ⭐ Stats Panel */}
      <div
        className="p-4 rounded"
        style={{
          background: "rgba(0,0,0,0.7)",
          maxWidth: "600px",
          margin: "0 auto",
          border: "1px solid #333",
          backdropFilter: "blur(4px)",
        }}
      >
        <h3 className="mb-3">Your Stats</h3>

        <div className="d-flex justify-content-between text-start px-3">
          <div>
            <p><strong>Total Movies:</strong> {totalMovies}</p>
            <p><strong>Watched:</strong> {watched}</p>
            <p><strong>Favorites:</strong> {favorites}</p>
          </div>

          <div>
            <p><strong>Avg Rating:</strong> {avgRating}</p>
            <p><strong>Your Reviews:</strong> {totalReviews}</p>
          </div>
        </div>

        {/* ⭐ Quick Navigation Buttons */}
        <div className="mt-4 d-flex justify-content-center gap-3">
          <Button onClick={goToWatchlist} style={{ background: "#cc5c99", border: "none" }}>
            Watchlist
          </Button>
          <Button onClick={goToFavorites} style={{ background: "#cc5c99", border: "none" }}>
            Favorites
          </Button>
          <Button onClick={goToReviews} style={{ background: "#cc5c99", border: "none" }}>
            Reviews
          </Button>
        </div>
      </div>

      {/* ⭐ Badges */}
      <h3 className="mt-5 mb-3">Badges</h3>

      <div className="d-flex flex-wrap justify-content-center gap-3">
        {badges.length === 0 && <p>No badges yet — start watching!</p>}

        {badges.map((b, i) => (
          <div
            key={i}
            style={{
              background: "rgba(0,0,0,0.6)",
              padding: "10px 15px",
              borderRadius: "12px",
              border: "1px solid #cc5c99",
              color: "white",
              fontWeight: "bold",
              cursor: "default",
              boxShadow: "0 0 10px rgba(0,0,0,0.4)",
            }}
            title={b.desc}
          >
            {b.label}
          </div>
        ))}
      </div>

      {/* ⭐ Logout Button */}
      <div className="mt-4">
        <Button className="me-2" onClick={handleShow}>
          Log Out
        </Button>
      </div>

      {/* ⭐ Logout Modal */}
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Log Out</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to Log Out?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleLogout}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PrivateUserProfile;