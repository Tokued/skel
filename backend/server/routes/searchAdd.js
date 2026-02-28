const express = require("express");
const router = express.Router();
const Search = require("../models/searchModel");

// POST /search/add
router.post("/add", async (req, res) => {
  try {
    const { username, query, category } = req.body;

    if (!username || !query) {
      return res.status(400).json({
        error: "Missing required fields: username, query",
      });
    }

    const newSearch = new Search({
      username,
      query,
      category: category || "movies",
    });

    const saved = await newSearch.save();
    return res.status(201).json(saved);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to save search",
      details: err.message,
    });
  }
});

module.exports = router;