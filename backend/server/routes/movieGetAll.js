const express = require("express");
const router = express.Router();
const newMovieModel = require('../models/movieModel')

router.get('/getAll', async (req, res) => {
    const movie = await newMovieModel.find();
    return res.json(movie)
  })

  module.exports = router;