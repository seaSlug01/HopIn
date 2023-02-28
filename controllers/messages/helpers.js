const Chat = require("../../schemas/ChatSchema.js");
const Message = require("../../schemas/MessageSchema.js");
const mongoose = require("mongoose");

function createChatName(name, users, nicknames = {}) {
  if(name.trim() === "") {
    name = users.map(({_id, firstName}) => {
      return nicknames[_id] || firstName;
    }).join(", ")
  }
  return name;
}

async function populateChat(chat) {
  if(chat) {
    await chat.populate({path: "users", select: "firstName lastName profilePic"})
      .populate({
        path: "latestMessage",
        populate: [
          {path: "seen.user", select: "firstName lastName profilePic"},
          {path: "sentBy", select: "firstName lastName profilePic"}
        ]
      })
      .populate({path: "updatedBy", select: "firstName lastName profilePic"})
      .execPopulate()
  }

  return chat
}

async function removeSeenFlagFromPreviousMessages(users, chatId) {
  // Chat id does not exist in the first message of a duet chat
  if(users.length && chatId) {
    const filter = {chatId, "seen.user": {$in: users}}
    const update = {$pull: {seen: {user: {$in: users}}}}

    await Message.updateMany(
      filter,
      update
    );
  }
}

function setDuetChatName(chatUsers, userLoggedInId) {
  const otherUser = chatUsers.find(u => u._id.toString() !== userLoggedInId.toString())
  const chatName = otherUser.firstName + " " + otherUser.lastName;
  return chatName.trim();
}

function setGroupChatName(chatName, userLoggedIn, nicknames = {}) {
  const userLoggedInFirstName = nicknames[userLoggedIn._id] || userLoggedIn.firstName;
  const otherUsersFirstNames = chatName.split(", ").filter(name => name !== userLoggedInFirstName);

  const maxNamesVisible = 3;
  const remaining = otherUsersFirstNames.length - maxNamesVisible;

  let others = ` and ${remaining} other${remaining > 1 ? "s" : ""}`
  return otherUsersFirstNames.length > maxNamesVisible ? otherUsersFirstNames.slice(0, 3).join(", ") + others : otherUsersFirstNames.join(", ")
}

async function chatListModifications(chats, userLoggedInId) {
  // cuz js methods can't be used on mongodb collections
  let chatsCopy = chats.slice();

  for(let chat of chatsCopy) {
    chat = await latestMessageIsHiddenByUser(chat, userLoggedInId)

    if(!chat.isGroupChat) continue;
    chatsCopy = excludeGroupChatsWithNoMessage(chat, chatsCopy, userLoggedInId)
  }

  return chatsCopy;
}

async function latestMessageIsHiddenByUser(chat, userLoggedInId) {
  const isHidden = chat.latestMessage.hiddenBy.includes(userLoggedInId);
  if(isHidden) {
    const newLatestMessage = await Message.findOne({chatId: chat._id, createdAt: {$lt: new Date(chat.latestMessage.createdAt)}, hiddenBy: {$nin: userLoggedInId}}).sort({createdAt: -1})
    chat.latestMessage = newLatestMessage;
  }

  return chat;
}

async function excludeGroupChatsWithNoMessage(chat, chatsCopy, userLoggedInId) {
  const isUserAdmin = chat.admin.some(id => id.toString() == userLoggedInId)
  const {firstName, lastName} = chat.updatedBy;
  let userDisplayName = firstName + " " + lastName;
  userDisplayName.trim();
  if(!isUserAdmin && chat.latestMessage.text === `${userDisplayName.trim()} created a group chat.`) {
    const indexOfChat = chatsCopy.indexOf(chat);
    chatsCopy.splice(indexOfChat, 1);
  }

  return chatsCopy;
}

async function createOrUpdateChat(chatScreenId, loggedInUserId, chat, message, customValues, docMayExist = false) {
  const messageId = mongoose.Types.ObjectId(message._id);
  loggedInUserId = mongoose.Types.ObjectId(loggedInUserId);
  let docExists = false;
  if(docMayExist) {
    docExists = await Chat.findOne({_id: mongoose.Types.ObjectId(docMayExist)})
  }
  console.log("docExists", docExists !== false)
  if(chat || docExists) {
    console.log("Chat already exists, updating it...")
    await removeSeenFlagFromPreviousMessages(message.seen.map(u => u.user), chat ? chat._id : docExists._id)

    let updatedChat = await Chat.findOneAndUpdate({_id: docExists._id || chat._id}, {updatedBy: loggedInUserId, latestMessage: messageId}, {useFindAndModify: false, new: true})

    message.chatId = docExists._id || chat._id;
    message = await message.save().then(async m => await populateMessage(m))

    updatedChat = await populateChat(updatedChat);

    return {chatDoc: updatedChat, messageDoc: message}
  }


  const otherChatUser = await User.findOne({_id: chatScreenId});
  if(!otherChatUser) throw new Error("Message sending failed, the user you're trying to chat with does not exist.");
  console.log("Creating new chat")
  const values = {users: [otherChatUser._id, loggedInUserId], createdBy: loggedInUserId, updatedBy: loggedInUserId, latestMessage: messageId, nicknames: {} };
  let newChat = await Chat.create({...values, ...customValues})

  message.chatId = newChat._id;
  await message.save().then(async m => await populateMessage(m));

  newChat = await populateChat(c);
  return {chatDoc: newChat, messageDoc: message};
}

function addReplyFlagIfNeeded(messageParams, isReplyTo) {
  if(isReplyTo && mongoose.Types.ObjectId(isReplyTo)) {
    messageParams.isReplyTo = mongoose.Types.ObjectId(isReplyTo);
  }

  return messageParams;
}

function setUsername(nicknames, userLoggedIn) {
  return nicknames[userLoggedIn._id] || userLoggedIn.firstName;
}

function messageParameters(messageParams, isReplyTo, addSeenToMessage, usersViewing) {
  let params = addReplyFlagIfNeeded(messageParams, isReplyTo);

  // some messages get sent at once
  // we only want the last one to receive the list of users that read it
  // In other cases addReplyFlagIfNeeded check is all it needs
  if(addSeenToMessage) {
    params.seen = usersViewing.map(userId => ({user: mongoose.Types.ObjectId(userId), at: new Date()}))
  }

  return params;
}

async function populateMessage(message) {
  return await message.populate({path: 'reactions.user', select: "firstName lastName profilePic"})
  .populate({path: 'sentBy', select: "firstName lastName profilePic"})
  .populate({path: 'seen.user', select: "firstName lastName profilePic"})
  .populate({path: "isReplyTo", select: "text sentBy", populate: { path: "sentBy", select: "firstName lastName"}}).execPopulate()
}

async function fetchMessages(query, sort, limit) {
  return await Message.find(query)
  .sort({createdAt: sort})
  .limit(limit)
  .populate({path: 'sentBy', select: "firstName lastName profilePic"})
  .populate({path: 'reactions.user', select: "firstName lastName profilePic"})
  .populate({path: 'seen.user', select: "firstName lastName profilePic"})
  .populate({path: "isReplyTo", select: "text sentBy", populate: { path: "sentBy", select: "firstName lastName"}})
}

module.exports = { createChatName, excludeGroupChatsWithNoMessage, setDuetChatName, setGroupChatName, createOrUpdateChat, addReplyFlagIfNeeded, populateMessage, fetchMessages, populateChat, removeSeenFlagFromPreviousMessages, messageParameters, setUsername, chatListModifications}