const express = require("express");
const router = express.Router();
const { addToHistory, search, usersWindow, renderSearchPage, historyView, deleteHistoryItem, deleteHistory} = require("../controllers/search");

router.post("/history", addToHistory)

router.put("/deleteHistory/:id", deleteHistoryItem)

router.delete("/deleteHistory", deleteHistory)

router.get("/viewHistory", historyView)

router.get("/q", search)

router.get("/users", usersWindow)

router.get("/", renderSearchPage)

module.exports = router;