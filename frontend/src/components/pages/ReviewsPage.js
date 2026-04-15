import React, { useEffect, useState } from "react";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const user = getUserInfo();

  useEffect(() => {
    if (!user?.id) return;

    const fetchReviews = async () => {
      try {
        // 1. Fetch raw reviews
        const res = await axios.get(
          `http://localhost:8081/reviews/user/${user.id}`
        );

        const rawReviews = res.data.reviews || [];

        // 2. Fetch movie details for each review
        const movieDetails = await Promise.all(
          rawReviews.map((r) =>
            axios.get(`http://localhost:8081/movies/${r.movieId}`)
          )
        );

        // 3. Merge review + movie details
        const merged = movieDetails.map((r, i) => ({
          ...rawReviews[i],
          ...r.data,
        }));

        setReviews(merged);
      } catch (err) {
        console.error("Reviews error:", err);
      }
    };

    fetchReviews();
  }, [user]);

  return (
    <div className="container mt-5 text-white">
      <h1 className="mb-4">Your Reviews</h1>

      {reviews.length === 0 && <p>You haven't written any reviews yet.</p>}

      <div className="d-flex flex-column gap-4">
        {reviews.map((review) => (
          <div
            key={review.movieId}
            style={{
              background: "rgba(0,0,0,0.6)",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #cc5c99",
            }}
          >
            <h4>{review.title}</h4>

            <img
              src={review.poster}
              alt={review.title}
              style={{
                width: "120px",
                borderRadius: "10px",
                marginBottom: "10px",
              }}
            />

            <p>{review.reviewText}</p>

            <p style={{ color: "#cc5c99" }}>
              Rating: {review.rating} / 5
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}