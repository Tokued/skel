const express = require("express");
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const dbConnection = require('./config/db.config');

// User routes
const loginRoute = require('./routes/userLogin');
const getAllUsersRoute = require('./routes/userGetAllUsers');
const registerRoute = require('./routes/userSignUp');
const getUserByIdRoute = require('./routes/userGetUserById');
const editUser = require('./routes/userEditUser');
const deleteUser = require('./routes/userDeleteAll');
const searchAddRoute = require("./routes/searchAdd");
const searchGetAllRoute = require("./routes/searchGetAll");
const movieRoutes = require("./routes/movies");
const trailerGet = require("./routes/trailerGet");

const reviewRoute = require("./routes/review.routes");

const SERVER_PORT = process.env.SERVER_PORT || 8081;

// Connect to database
dbConnection();

// ✅ FIXED MIDDLEWARE
app.use(cors());           // allow all requests (fixes ERR_NETWORK)
app.use(express.json());   // only once

// Routes
app.use("/reviews", reviewRoute);

// ---------------- USER ROUTES ----------------
app.use('/user', loginRoute);
app.use('/user', registerRoute);
app.use('/user', getAllUsersRoute);
app.use('/user', getUserByIdRoute);
app.use('/user', editUser);
app.use('/user', deleteUser);

// ---------------- SEARCH ROUTES ----------------
app.use("/search", searchAddRoute);
app.use("/search", searchGetAllRoute);

// ---------------- USER-MOVIE ROUTES ----------------
app.use("/user-movie", require("./routes/userMovieAdd.js"));
app.use("/user-movie", require("./routes/userMovieGetAll.js"));

// ---------------- WATCHLIST ROUTES ----------------
app.use("/watchlist", require("./routes/watchlistAdd.js"));
app.use("/watchlist", require("./routes/watchlistDelete.js"));
app.use("/watchlist", require("./routes/watchlistGetAll.js"));
app.use("/watchlist", require("./routes/watchlistRate.js"));
app.use("/watchlist", require("./routes/watchlistWatched.js"));
app.use("/watchlist", require("./routes/watchlistFavorite.js"));

// ---------------- MOVIE ROUTES -------------------
app.use("/movies", movieRoutes);

// ---------------- TRAILER ROUTES ----------------
app.use("/trailers", trailerGet);

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
    res.send("Backend service is running.");
});

// Start server
app.listen(SERVER_PORT, () => {
    console.log(`The backend service is running on port ${SERVER_PORT} and waiting for requests.`);
});