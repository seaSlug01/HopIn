const express = require('express');
const router = express.Router();
const axios = require("axios");

router.get("/trending", async (req, res) => {
  const {data: {data}} = await axios.get(`https://api.giphy.com/v1/gifs/trending?api_key=${process.env.GIPHY_API_KEY}&limit=25&rating=g`);

  res.status(200).send({GIFs: data})
})

router.get("/search/:q", async (req, res) => {
  const q = req.params.q;
  const offset = req.query.offset ?? 0;

  const {data: {data}} = await axios.get(`https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${q}&limit=25&offset=${offset}&rating=g&lang=en`)

  res.status(200).send({GIFS: data})
})

module.exports = router;