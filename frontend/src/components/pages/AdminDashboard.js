import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Button, Form, Badge, Spinner } from "react-bootstrap";

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

  // 📥 GET USERS
  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(`${API}/users`, authHeader());
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [authHeader]);

  // 📥 GET USER REVIEWS
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
      console.error("Error loading reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // ❌ DELETE REVIEW
  const deleteReview = async (id) => {
    try {
      await axios.delete(`${API}/reviews/${id}`, authHeader());
      setReviews((prev) => prev.filter((r) => r._id !== id));

      // auto refresh user list (optional but nice)
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // 🚩 FLAG REVIEW
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

  // ⚠️ WARN USER
  const warnUser = async (userId) => {
    try {
      await axios.put(`${API}/users/${userId}/warn`, {}, authHeader());
      alert("User warned");
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔨 BAN USER
  const banUser = async (userId) => {
    try {
      await axios.put(`${API}/users/${userId}/ban`, {}, authHeader());
      alert("User banned");
      loadUsers();

      // if banned user is currently selected, refresh their reviews
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

  // 🔎 FILTER USERS
  const filteredUsers = users.filter((u) =>
    (u.username || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container className="mt-4">
      <h2>🛠 Admin Dashboard</h2>

      {/* SEARCH */}
      <Form className="my-3">
        <Form.Control
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Form>

      <Row>
        {/* USERS */}
        <Col md={4}>
          <h4>Users</h4>

          {loadingUsers && (
            <div className="text-center my-3">
              <Spinner animation="border" size="sm" /> Loading users...
            </div>
          )}

          {filteredUsers.map((user) => (
            <Card key={user._id} className="mb-2 p-2">
              <strong>{user.username || "Unknown User"}</strong>

              {user.isBanned && (
                <Badge bg="danger" className="ms-2">
                  Banned
                </Badge>
              )}

              <div className="mt-2">
                <Button size="sm" onClick={() => loadUserReviews(user._id)}>
                  View Reviews
                </Button>{" "}
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => warnUser(user._id)}
                >
                  Warn
                </Button>{" "}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => banUser(user._id)}
                >
                  Ban
                </Button>
              </div>
            </Card>
          ))}
        </Col>

        {/* REVIEWS */}
        <Col md={8}>
          <h4>User Reviews</h4>

          {!selectedUser && <p>Select a user to view reviews</p>}

          {loadingReviews && (
            <div className="text-center my-3">
              <Spinner animation="border" size="sm" /> Loading reviews...
            </div>
          )}

          {reviews.map((review) => (
            <Card key={review._id} className="mb-2 p-2">
              <p>{review.reviewText}</p>
              <small>⭐ {review.rating}</small>

              {review.flagged && (
                <Badge bg="warning" className="ms-2">
                  Flagged
                </Badge>
              )}

              <div className="mt-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => deleteReview(review._id)}
                >
                  Delete
                </Button>{" "}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => flagReview(review._id)}
                >
                  Flag
                </Button>
              </div>
            </Card>
          ))}
        </Col>
      </Row>
    </Container>
  );
}