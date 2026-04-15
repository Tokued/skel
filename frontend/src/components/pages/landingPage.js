import React from 'react';
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";

const Landingpage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center text-white"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1400&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Dark cinematic overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9))",
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-5xl font-bold mb-4 tracking-wide">
          🎬 MovieVerse
        </h1>

        <p className="text-lg text-gray-300 mb-5 max-w-xl mx-auto">
          Discover movies. Track your favorites. Build your cinematic universe.
        </p>

        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant="primary"
            className="px-4 py-2 rounded-lg"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </Button>

          <Button
            variant="outline-light"
            className="px-4 py-2 rounded-lg"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landingpage;