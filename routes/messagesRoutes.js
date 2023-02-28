const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const { getChatThroughChatId, getChatThroughUsersId } = require("../controllers/messages");

router.get("/t/:chatId", async (req, res) => {
  let chatId = req.params.chatId;
  let payload = {...createPayload(req, req.session.user.firstName + " " + req.session.user.lastName)}
  const userLoggedInId = mongoose.Types.ObjectId(req.session.user._id);

  try {
    const {messages, chat, userPayload} = await getChatThroughChatId(chatId, userLoggedInId, payload, getChatThroughUsersId);
    
    res.status(200).render('chatPage', {...userPayload, messages: JSON.stringify(messages), chat: JSON.stringify(chat) })  
  } catch(error) {
    console.log(error);
  }
})

router.get('/new/groups', (req, res, next) => {
  res.status(200).render('messages', createPayload(req, "Chats", 2));
});

router.get('/new', (req, res, next) => {
  res.status(200).render('messages', createPayload(req, "Chats", 1));
});

router.get('/', (req, res, next) => {
  res.status(200).render('messages', createPayload(req, "Chats", 0));
});

function createPayload(req, pageTitle, activeTab = null) {
  return {
    pageTitle,
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
    activeTab
  }
}

module.exports = router;