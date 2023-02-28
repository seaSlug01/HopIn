const express = require('express');
const router = express.Router();
const emojis = require("../../emoji.js");
var emojiLib = require('node-emoji')

router.get("/search/:searchTerm", async (req, res) => {
  
  let emojis = await emojiLib.search(req.params.searchTerm)
  res.status(200).send(emojis)
})

router.get("/get/:name", async (req, res) => {
  const emoji = await emojiLib.get(req.params.name)

  res.status(200).send(emoji)
})

router.get("/", async (req, res) => {
  res.status(200).send(emojis)
})



module.exports = router;