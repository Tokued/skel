const express = require("express");
const router = express.Router();
const Search = require("../models/searchModel");

// GET /search/getAll
router.get("/getAll", async (req, res) => {
  try {
    const searches = await Search.find().sort({ createdAt: -1 });
    return res.status(200).json(searches);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch search records",
      details: err.message,
    });
  }
});

module.exports = router;