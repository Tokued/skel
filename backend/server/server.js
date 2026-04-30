const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const dbConnection = require("./config/db.config");

// ---------------- AI ROUTE ----------------
// File must be named: routes/aiRoutes.js
// It registers: router.post("/ai-search", ...)
// Mounted at "/" so the full path is POST /ai-search
// which matches what AiSearchResultsPage calls:
//   axios.post("http://localhost:5000/ai-search", ...)
const aiRoutes = require("./routes/aiRoutes");

// ---------------- USER ROUTES ----------------
const loginRoute = require("./routes/userLogin");
const getAllUsersRoute = require("./routes/userGetAllUsers");
const registerRoute = require("./routes/userSignUp");
const getUserByIdRoute = require("./routes/userGetUserById");
const editUser = require("./routes/userEditUser");
const deleteUser = require("./routes/userDeleteAll");

// ---------------- OTHER ROUTES ----------------
const searchAddRoute = require("./routes/searchAdd");
const searchGetAllRoute = require("./routes/searchGetAll");
const movieRoutes = require("./routes/movies");
const trailerGet = require("./routes/trailerGet");
const adminRoutes = require("./routes/admin");
const reviewRoute = require("./routes/review.routes");

// ---------------- WATCHLIST ROUTES ----------------
const watchlistAdd = require("./routes/watchlistAdd");
const watchlistDelete = require("./routes/watchlistDelete");
const watchlistGetAll = require("./routes/watchlistGetAll");
const watchlistRate = require("./routes/watchlistRate");
const watchlistWatched = require("./routes/watchlistWatched");
const watchlistFavorite = require("./routes/watchlistFavorite");

const SERVER_PORT = process.env.SERVER_PORT || 8081;

// ---------------- DB CONNECTION ----------------
dbConnection();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// ---------------- ROUTES ----------------
app.use("/reviews", reviewRoute);
app.use("/admin", adminRoutes);

// USER
app.use("/user", loginRoute);
app.use("/user", registerRoute);
app.use("/user", getAllUsersRoute);
app.use("/user", getUserByIdRoute);
app.use("/user", editUser);
app.use("/user", deleteUser);

// SEARCH
app.use("/search", searchAddRoute);
app.use("/search", searchGetAllRoute);

// USER MOVIE
app.use("/user-movie", require("./routes/userMovieAdd"));
app.use("/user-movie", require("./routes/userMovieGetAll"));

// WATCHLIST
app.use("/watchlist", watchlistAdd);
app.use("/watchlist", watchlistDelete);
app.use("/watchlist", watchlistGetAll);
app.use("/watchlist", watchlistRate);
app.use("/watchlist", watchlistWatched);
app.use("/watchlist", watchlistFavorite);

// AI — mounted at root so router.post("/ai-search") → POST /ai-search
app.use("/ai", aiRoutes);

// MOVIES
app.use("/movies", movieRoutes);

// TRAILERS
app.use("/trailers", trailerGet);

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Backend service is running.");
});

// ---------------- START SERVER ----------------
app.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});