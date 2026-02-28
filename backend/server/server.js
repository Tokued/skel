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

const SERVER_PORT = process.env.SERVER_PORT || 8081;

// Connect to database
dbConnection();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

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

// ---------------- WATCHLIST SETUP ----------------

// Watchlist schema & model
const watchlistSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    movieId: { type: String, required: true },
    title: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
});

// Prevent duplicate movies for the same user
watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

// Add a movie to watchlist
app.post("/watchlist/add", async (req, res) => {
    try {
        const { userId, movieId, title } = req.body;

        if (!userId || !movieId || !title) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const exists = await Watchlist.findOne({ userId, movieId });
        if (exists) {
            return res.status(409).json({ message: "Movie already in watchlist" });
        }

        const newItem = new Watchlist({ userId, movieId, title });
        await newItem.save();

        res.status(201).json({ message: "Movie added to watchlist", data: newItem });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get all movies for a specific user
app.get("/watchlist/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const watchlist = await Watchlist.find({ userId }).sort({ addedAt: -1 });
        res.json(watchlist);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
    res.send("Backend service is running.");
});

// Start server
app.listen(SERVER_PORT, () => {
    console.log(`The backend service is running on port ${SERVER_PORT} and waiting for requests.`);
});