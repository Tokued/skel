import React, { useEffect, useState } from "react";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";
import badgeDefinitions from "../badges";

const BadgesProgressPage = () => {
  const [stats, setStats] = useState(null);
  const user = getUserInfo();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // ⭐ Fetch watchlist
        const watchlistRes = await axios.get(
          `http://localhost:8081/watchlist/${user.id}`
        );
        const watchlist = watchlistRes.data || [];

        const favorites = watchlist.filter((m) => m.favorite).length;
        const watched = watchlist.filter((m) => m.watched).length;
        const rated = watchlist.filter((m) => m.rating && m.rating > 0).length;

        // ⭐ Fetch reviews
        const reviewRes = await axios.get(
          `http://localhost:8081/reviews/user/${user.id}`
        );

        const rawReviews = reviewRes.data.reviews || [];
        const totalReviews = rawReviews.length;

        // ⭐ Save stats
        setStats({
          watched,
          rated,
          favorites,
          totalReviews,
        });
      } catch (err) {
        console.error("🔥 BADGE PAGE ERROR:", err.response?.data || err.message);
      }
    };

    fetchStats();
  }, [user]);

  if (!stats) {
    return <div className="text-white mt-5">Loading badge progress...</div>;
  }

  return (
    <div
      className="container text-white mt-5"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1920&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 0 20px rgba(0,0,0,0.6)",
      }}
    >
      <h1 className="mb-4">Badge Progress</h1>

      {badgeDefinitions.map((badge) => {
        const current = badge.progress(stats);
        const goal = badge.goal;
        const unlocked = current >= goal;
        const percent = Math.min((current / goal) * 100, 100);

        return (
          <div
            key={badge.id}
            style={{
              background: "rgba(0,0,0,0.6)",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
              border: unlocked ? "2px solid #cc5c99" : "2px solid #444",
            }}
          >
            <h3 style={{ color: unlocked ? "#cc5c99" : "#888" }}>
              {badge.label}
            </h3>
            <p>{badge.desc}</p>

            {/* Progress Bar */}
            <div
              style={{
                background: "#333",
                height: "12px",
                borderRadius: "6px",
                overflow: "hidden",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: unlocked ? "#cc5c99" : "#555",
                }}
              ></div>
            </div>

            <p>
              {current}/{goal}
            </p>

            {!unlocked && (
              <p style={{ color: "#cc5c99" }}>
                {goal - current} more to unlock this badge
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BadgesProgressPage;
