import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Container, Card, Form, Button, Row, Col, Badge } from "react-bootstrap";

const API = "http://localhost:8081/reviews";

// ✅ FIX: get real logged-in user
const CURRENT_USER_ID = JSON.parse(localStorage.getItem("user"))?._id;

export default function MovieReviews({ movieId }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!movieId) return;

    try {
      const res = await axios.get(`${API}/movie/${movieId}`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error(err);
      setReviews([]);
    }
  }, [movieId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating || !reviewText) return;

    try {
      if (editingReview) {
        await axios.put(`${API}/${editingReview._id}`, {
          userId: CURRENT_USER_ID,
          rating,
          reviewText,
        });

        setEditingReview(null);
      } else {
        await axios.post(`${API}/add`, {
          userId: CURRENT_USER_ID,
          movieId,
          rating,
          reviewText,
        });
      }

      setRating(0);
      setReviewText("");
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error submitting review");
    }
  };

  const deleteReview = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, {
        data: { userId: CURRENT_USER_ID },
      });

      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const likeReview = async (id) => {
    try {
      await axios.post(`${API}/${id}/like`, {
        userId: CURRENT_USER_ID,
      });

      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const dislikeReview = async (id) => {
    try {
      await axios.post(`${API}/${id}/dislike`, {
        userId: CURRENT_USER_ID,
      });

      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setReviewText(review.reviewText);
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setRating(0);
    setReviewText("");
  };

  const hasReviewed = reviews.some(
    (r) => r.userId?._id === CURRENT_USER_ID
  );

  return (
    <Container className="mt-4">
      <h4 className="mb-3">Reviews</h4>

      {/* ADD / EDIT FORM */}
      {editingReview || !hasReviewed ? (
        <Card className="p-3 mb-4 shadow-sm">
          <h5>{editingReview ? "Edit Review" : "Add a Review"}</h5>

          <Form onSubmit={submitReview}>
            <Row className="mb-2">
              <Col md={4}>
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

              <Col md={8}>
                <Form.Control
                  placeholder="Write your review..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
              </Col>
            </Row>

            <Button type="submit">
              {editingReview ? "Update Review" : "Submit Review"}
            </Button>

            {editingReview && (
              <Button
                variant="secondary"
                className="ms-2"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            )}
          </Form>
        </Card>
      ) : (
        <p className="text-muted">You’ve already reviewed this movie.</p>
      )}

      {reviews.length === 0 && <p>No reviews yet.</p>}

      {/* REVIEWS LIST */}
      {reviews.map((r) => (
        <Card key={r._id} className="p-3 mb-2 shadow-sm">
          <Row>
            <Col md={4}>
              <strong>User:</strong>{" "}
              {r.userId?.username || r.userId}
            </Col>

            <Col md={4}>
              <strong>Rating:</strong>{" "}
              <Badge bg="warning" text="dark">
                {"⭐".repeat(r.rating)}
              </Badge>
            </Col>

            <Col md={4} className="text-end">
              {r.userId?._id === CURRENT_USER_ID && (
                <>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => startEdit(r)}
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => {
                      if (window.confirm("Delete this review?")) {
                        deleteReview(r._id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </Col>
          </Row>

          <p className="mt-2">{r.reviewText}</p>

          <small className="text-muted">
            Posted on {new Date(r.createdAt).toLocaleString()}
          </small>

          <div className="mt-2">
            <Button
              size="sm"
              variant="outline-success"
              className="me-2"
              onClick={() => likeReview(r._id)}
            >
              👍 {r.likes?.length || 0}
            </Button>

            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => dislikeReview(r._id)}
            >
              👎 {r.dislikes?.length || 0}
            </Button>
          </div>
        </Card>
      ))}
    </Container>
  );
}