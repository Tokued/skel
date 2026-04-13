import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
} from "react-bootstrap";

const API = "http://localhost:8081/admin";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const token = localStorage.getItem("token");

  const authHeader = useCallback(() => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, [token]);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(`${API}/users`, authHeader());
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }, [authHeader]);

  const loadUserReviews = async (userId) => {
    try {
      setLoadingReviews(true);
      setSelectedUser(userId);

      const res = await axios.get(
        `${API}/users/${userId}/reviews`,
        authHeader()
      );

      setReviews(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const deleteReview = async (id) => {
    try {
      await axios.delete(`${API}/reviews/${id}`, authHeader());
      setReviews((prev) => prev.filter((r) => r._id !== id));
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const flagReview = async (id) => {
    try {
      await axios.put(`${API}/reviews/${id}/flag`, {}, authHeader());

      setReviews((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, flagged: true } : r
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const warnUser = async (userId) => {
    try {
      await axios.put(`${API}/users/${userId}/warn`, {}, authHeader());
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const banUser = async (userId) => {
    try {
      await axios.put(`${API}/users/${userId}/ban`, {}, authHeader());
      loadUsers();

      if (selectedUser === userId) {
        loadUserReviews(userId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) =>
    (u.username || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <Container>
        <h2 className="fw-bold mb-4 text-light">🛠 Admin Dashboard</h2>

        {/* SEARCH */}
        <Form className="mb-4">
          <Form.Control
            placeholder="🔍 Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              backgroundColor: "#1e293b",
              border: "none",
              color: "white",
            }}
          />
        </Form>

        <Row>
          {/* USERS */}
          <Col md={4}>
            <h5 className="mb-3 text-secondary">Users</h5>

            {loadingUsers && (
              <div className="text-center text-light">
                <Spinner animation="border" size="sm" />
              </div>
            )}

            {filteredUsers.map((user) => (
              <Card
                key={user._id}
                className="mb-3 border-0"
                style={{
                  background:
                    selectedUser === user._id ? "#1d4ed8" : "#1e293b",
                  color: "white",
                  borderRadius: "12px",
                }}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>{user.username || "Unknown User"}</strong>

                    {user.isBanned && (
                      <Badge bg="danger">Banned</Badge>
                    )}
                  </div>

                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => loadUserReviews(user._id)}
                    >
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => warnUser(user._id)}
                    >
                      Warn
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => banUser(user._id)}
                    >
                      Ban
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}

            {!loadingUsers && filteredUsers.length === 0 && (
              <p className="text-secondary">No users found</p>
            )}
          </Col>

          {/* REVIEWS */}
          <Col md={8}>
            <h5 className="mb-3 text-secondary">Reviews</h5>

            {!selectedUser && (
              <p className="text-secondary">
                Select a user to view reviews
              </p>
            )}

            {loadingReviews && (
              <div className="text-center text-light">
                <Spinner animation="border" size="sm" />
              </div>
            )}

            {reviews.map((review) => (
              <Card
                key={review._id}
                className="mb-3 border-0"
                style={{
                  background: "#1e293b",
                  color: "white",
                  borderRadius: "12px",
                }}
              >
                <Card.Body>
                  <h6 className="fw-bold mb-1">
                    🎬 {review.movieTitle}
                  </h6>

                  <p className="text-secondary small mb-1">
                    ⭐ {review.rating}
                  </p>

                  <p className="mb-2">{review.reviewText}</p>

                  {review.flagged && (
                    <Badge bg="warning" className="mb-2">
                      Flagged
                    </Badge>
                  )}

                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteReview(review._id)}
                    >
                      Delete
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => flagReview(review._id)}
                    >
                      Flag
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}

            {!loadingReviews && selectedUser && reviews.length === 0 && (
              <p className="text-secondary">No reviews found</p>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}