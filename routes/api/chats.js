const express = require('express');
const router = express.Router();
const multer  = require('multer')
const upload = multer({dest: "uploads/files/"})
const { newChat, getUserChats, uploadChatImages, sendTextMessage, uploadChatVideos, uploadChatFiles, messageReaction, hideMessage, deleteMessage, fetchMoreMessages, changeAdminStatus, addPeople, removeUserFromGroupChat, setNickname, setChatName, setChatImage, fetchMedia, searchMessageById, searchMessagesByKeyword, updateSeenFlag } = require("../../controllers/messages");

router.post("/send/:id/media/images", uploadChatImages)

router.post("/send/:id/media/videos", uploadChatVideos)

router.post("/send/:id/media/files", uploadChatFiles)

router.post("/send/:id/text", sendTextMessage)

router.put("/hide/:id", hideMessage)

router.put("/delete/:id", deleteMessage)

router.post("/reaction/:userId", messageReaction)

router.post("/new", newChat)

router.get("/fetch/:chatId", fetchMoreMessages)

router.put("/admin/:userId", changeAdminStatus)

router.put("/addPeople", addPeople)

router.put("/updateSeenFlag", updateSeenFlag)

router.put("/removeUser", removeUserFromGroupChat)

router.put("/setNickname", setNickname)

router.put("/setChatName", setChatName)

router.put("/uploadChatImage", upload.single("file"), setChatImage);

router.get("/:userId", getUserChats)

router.get("/fetchMedia/:chatId/:type", fetchMedia);

router.get("/searchMessageById/:id", searchMessageById);

router.get("/searchMessagesByKeyword/:keywords", searchMessagesByKeyword)



module.exports = router;