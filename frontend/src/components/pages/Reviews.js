import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Form, Button, Row, Col, Badge } from "react-bootstrap";

const API = "http://localhost:8081/reviews";

export default function Reviews() {
  const [movieId, setMovieId] = useState("");
  const [userId, setUserId] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [searchUser, setSearchUser] = useState("");

  // Fetch all reviews
  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}/all`);
      setReviews(res.data.reviews);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch reviews by user
  const fetchByUser = async () => {
    if (!searchUser) return fetchReviews();
    try {
      const res = await axios.get(`${API}/user/${searchUser}`);
      setReviews(res.data.reviews);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit new review
  const submitReview = async (e) => {
    e.preventDefault();
    if (!movieId || !userId || !rating || !reviewText) return;

    try {
      await axios.post(`${API}/add`, { movieId, userId, rating, reviewText });
      setMovieId("");
      setUserId("");
      setRating(0);
      setReviewText("");
      fetchReviews();
    } catch (err) {
      console.error(err);
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
        <Form onSubmit={submitReview}>
          <Row>
            <Col md={6} className="mb-2">
              <Form.Control
                placeholder="Movie ID"
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                required
              />
            </Col>
            <Col md={6} className="mb-2">
              <Form.Control
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-2">
              <Form.Select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
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
            <Button onClick={fetchByUser} className="me-2">
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