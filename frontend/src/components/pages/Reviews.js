import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Form, Button, Row, Col, Badge, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import getUserInfo from "../../utilities/decodeJwt";

// ✅ FIXED HERE
const BACKEND_URI = process.env.REACT_APP_BACKEND_SERVER_URI || "http://localhost:8081";
const API = `${BACKEND_URI}/reviews`;
export default function Reviews() {
  const { id } = useParams(); // Movie ID from route
  const [movieId, setMovieId] = useState(id || "");
  const [userId, setUserId] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // <-- for error feedback
  const [successMessage, setSuccessMessage] = useState(""); // <-- for success feedback

  // Fetch logged-in user info
  useEffect(() => {
    const user = getUserInfo();
    if (user?.id) setUserId(user.id);
  }, []);

  // Fetch all reviews
  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}/all`);
      setReviews(res.data.reviews);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit new review with feedback
  const submitReview = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!movieId || !userId || !rating || !reviewText) {
      setErrorMessage("All fields are required!");
      return;
    }

    try {
      const res = await axios.post(`${API}/add`, {
        movieId,
        userId,
        rating: Number(rating), // <-- ensure number
        reviewText,
      });

      setSuccessMessage("Review submitted successfully!");
      setReviewText("");
      setRating(0);
      fetchReviews();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage("Failed to submit review. Please try again.");
      }
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">🎬 Movie Reviews</h2>

      {/* Add Review Form */}
      <Card className="p-4 mb-4 shadow-sm">
        <h4 className="mb-3">Add a Review</h4>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <Form onSubmit={submitReview}>
          <Row>
            <Col md={6} className="mb-2">
              <Form.Control
                placeholder="Movie ID"
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                required
                readOnly={!!id}
              />
            </Col>
            <Col md={6} className="mb-2">
              <Form.Control
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                readOnly={!!userId}
              />
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-2">
              <Form.Select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                required
              >
                <option value={0}>Select Rating</option>
                <option value={1}>⭐ 1</option>
                <option value={2}>⭐⭐ 2</option>
                <option value={3}>⭐⭐⭐ 3</option>
                <option value={4}>⭐⭐⭐⭐ 4</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5</option>
              </Form.Select>
            </Col>
            <Col md={6} className="mb-2">
              <Form.Control
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
              />
            </Col>
          </Row>

          <Button type="submit" className="mt-2" variant="primary">
            Submit Review
          </Button>
        </Form>
      </Card>

      {/* Filter by User */}
      <Card className="p-3 mb-4 shadow-sm">
        <h5>Filter Reviews by User</h5>
        <Row className="g-2">
          <Col md={6}>
            <Form.Control
              placeholder="Enter User ID"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </Col>
          <Col md={6}>
            <Button onClick={() => searchUser ? axios.get(`${API}/user/${searchUser}`).then(res => setReviews(res.data.reviews)) : fetchReviews()} className="me-2">
              Search
            </Button>
            <Button variant="secondary" onClick={fetchReviews}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Reviews List */}
      <h4 className="mb-3">All Reviews</h4>
      {reviews.length === 0 && <p>No reviews yet.</p>}
      {reviews.map((r) => (
        <Card key={r._id} className="p-3 mb-2 shadow-sm">
          <Row>
            <Col md={4}>
              <strong>Movie:</strong> {r.movieId}
            </Col>
            <Col md={4}>
              <strong>User:</strong> {r.userId}
            </Col>
            <Col md={4}>
              <strong>Rating:</strong>{" "}
              <Badge bg="warning" text="dark">
                {"⭐".repeat(r.rating)}
              </Badge>
            </Col>
          </Row>
          <p className="mt-2">{r.reviewText}</p>
          <small className="text-muted">
            Posted on {new Date(r.createdAt).toLocaleString()}
          </small>
        </Card>
      ))}
    </Container>
  );
}