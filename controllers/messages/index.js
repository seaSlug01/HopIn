const Chat = require("../../schemas/ChatSchema.js");
const Message = require("../../schemas/MessageSchema.js");
const User = require("../../schemas/UserSchema.js");
const mongoose = require("mongoose");
const {ObjectId} = require('mongodb');
const cloudinary = require("cloudinary").v2;
const { createChatName, createOrUpdateChat, setDuetChatName, setGroupChatName, addReplyFlagIfNeeded, populateMessage, fetchMessages, populateChat, removeSeenFlagFromPreviousMessages, messageParameters, setUsername, chatListModifications } = require("./helpers");
const { directoryPath, fileUpload, createUserDirectory, saveFile, uploadToGoogleCloudBucket, removeFile, removeFiles } = require("../utils.js");
const path = require("path");
const { removeScriptTags } = require("../../utils.js");
const striptags = require('striptags');


mongoose.set('useFindAndModify', false);

// variables commonly used among route actions
const messageLimit = 15;

async function newChat(req, res) {
  let chatExists;
  const userLoggedInId = mongoose.Types.ObjectId(req.session.user._id);
  let {users, chatName} = req.body; 
  const customName = chatName.trim() !== "";
  chatName = createChatName(chatName, users)
  const isGroupChat = users.length > 2;
  const userIds = users.map(u => mongoose.Types.ObjectId(u._id))
  const chatObject = {
    createdBy: userLoggedInId, 
    isGroupChat,
    chatName,
    customName,
    users: userIds,
    admin: userLoggedInId,
    updatedBy: userLoggedInId
  }

  try {
    chatExists = await Chat.findOne({
      $and: [
        {createdBy: { $eq: userLoggedInId }},
        {users: {
          $size: users.length,
          $all: userIds
        }}
      ]
    })

    // no need to populate chat in this case since you're just sending the id in order to redirect to that page

    if(chatExists) {
      console.log("Chat exists, and its a group chat")
      return res.status(200).send({ chatId: chatExists._id  })
    }
  
    const chat = new Chat(chatObject);
    const message = new Message({text: `${req.session.user.firstName} ${req.session.user.lastName} created a group chat.`, chatId: chat._id, messageType: "info"})
    chat.latestMessage = message;

    await chat.save();
    await message.save();

    console.log("not exists, creating new");
    res.status(201).send({ chatId: chat._id  });
  } catch(error) {
    console.log(error);
    res.status(500).send("Something went wrongo")
  }
}

async function getUserChats(req, res) {

  let chats = await Chat.find({
    users: {$in: [req.params.userId]}
  })
  .sort({updatedAt: -1})
  .populate({ path: 'users', select: "profilePic firstName lastName" })
  .populate({ path: "latestMessage"})
  .populate({ path: "updatedBy", select: "firstName lastName"})

  chats = await chatListModifications(chats, req.params.userId)

  res.status(200).send(chats)
}

async function uploadChatImages(req, res) {
  const chatScreenId = mongoose.Types.ObjectId(req.params.id);
  const chat = req.body.chat;
  const isReplyTo = req.body.replyTo;
  const chatId = chat ? chat._id : mongoose.Types.ObjectId(req.body.customId) || new ObjectId();
  const imagesData = req.body.images;
  let usersViewing = req.body.usersViewing;

  let multiplePicturePromise = [];
  let imageCurrentPaths = [];
  for(let imgObj of imagesData) {
    multiplePicturePromise.push(cloudinary.uploader.upload(directoryPath(imgObj.path, "../")))
    imageCurrentPaths.push(imgObj.path);
  }

  try {
    let imageResponses = await Promise.all(multiplePicturePromise)
    await removeFiles(imageCurrentPaths, "../");

    imageResponses.forEach(response => {
      const filename = response?.original_filename?.split("-")[0];
      // img.size cannot really be trusted
      // but I had no other choice since non english named images
      // return with no "original_filename" property
      // even tho I've specified in the upload func
      // that image filename should be included.
      // original_filename is more unique since its a combination of
      // dropzone unique filename property(numeric) and the actual name of the original image
      const imageItem = imagesData.find(img => img.filename === filename || img.size === response.bytes);

      delete imageItem.fieldname;
      delete imageItem.destination;
      delete imageItem.thumbnail;

      imageItem.path = response.secure_url;
    })

    const username = chat.nicknames[req.session.user._id] || req.session.user.firstName
    const messageText = `${username} sent ${imagesData.length > 1 ? imagesData.length : "a"} photo${imagesData.length > 1 ? "s" : ""}`

    let messageParams = messageParameters({media: imagesData, sentBy: req.session.user._id, text: messageText}, isReplyTo, true, usersViewing)

    const message = new Message(messageParams)
    const {chatDoc, messageDoc} = await createOrUpdateChat(chatScreenId, req.session.user._id, chat, message, {_id: chatId}, req.body.customId);

    console.log("Uploading images complete")
    return res.status(201).send({success: true, message: messageDoc, chat: chatDoc})
  } catch(err) {
    console.log(err)
    return res.status(500).send({success: false, message: "Something went wrong while uploading your images to the server."});
  }
}

async function sendTextMessage(req, res) {
  const text = striptags(req.body.text);
  if(!text.length) return res.status(403).send({alert: "You tried to send script tags, eh?"})

  const chat = req.body.chat;
  const isReplyTo = req.body.replyTo;
  let usersViewingIds = req.body.usersViewing.filter(userId => userId !== req.session.user._id);
  // chatScreenId could either be a chatId, or a user Id;
  // We need it, cuz if there's no chat...we can at least try and find a user
  // so that we can create our users array
  // group chats are automatically created the moment you press a button
  // so we're only looking for 2 persons chat rooms here
  // makes me wonder if I should rename it to chatFellowId or smth 
  const chatScreenId = mongoose.Types.ObjectId(req.params.id);
  let chatUpdateValues = {updatedBy: req.session.user._id};
  let chatFilter = chat ? {_id: chat._id} : {_id: new ObjectId()}

  let messageParameters = addReplyFlagIfNeeded({sentBy: req.session.user._id, text, seen: usersViewingIds.map(userId => ({user: mongoose.Types.ObjectId(userId), at: new Date()}))}, isReplyTo);

  try {
    await removeSeenFlagFromPreviousMessages(usersViewingIds, chat?._id);

    const message = new Message(messageParameters)
    await message.save();

    if(!chat) {
      console.log("cHAT does not exist")
      // search for a valid user
      const user = await User.findOne({_id: chatScreenId })
      console.log("user EXISTS", user._id)
      if(user) {
        chatUpdateValues = {...chatUpdateValues, users: [chatScreenId, mongoose.Types.ObjectId(req.session.user._id)]}
      } else {
        return res.status(404).send({message: "Message send failed, user does not exist."})
      }
    }
  
    const chatDoc = await Chat.findOneAndUpdate(chatFilter, {...chatUpdateValues, latestMessage: message._id}, { useFindAndModify: false, upsert: true, new: true })
    .then(async c => await populateChat(c));

    // const { text, seen } = chatDoc.latestMessage;
    // console.log("latestMessage ", text, seen)

    message.chatId = chatDoc._id;
    await message.save().then(async m => await populateMessage(m));
    
    return res.status(201).send({success: true, message, chat: chatDoc });
  } catch(error) {
    console.log(error)
  }
}

async function uploadChatVideos(req, res) {
  const videos = req.body.videos;
  const chat = req.body.chat;
  const isReplyTo = req.body.replyTo;
  const chatId = chat ? chat._id : mongoose.Types.ObjectId(req.body.customId) || new ObjectId();
  const chatScreenId = mongoose.Types.ObjectId(req.params.id);
  let usersViewing = req.body.usersViewing;
  let messages = [];
  const username = chat.nicknames[req.session.user._id] || req.session.user.firstName;
  const messageText = `${username} sent a video.`
  try {
    if(videos) {
      let videoCurrentPaths = [];
      let videoUploadPromises = [];

      for(let video of videos) {
        videoCurrentPaths.push(video.path);
        videoUploadPromises.push(fileUpload(video.path, "../", { resource_type: "video" }))
      }

      const videoResponses = await Promise.all(videoUploadPromises);
      await removeFiles(videoCurrentPaths, "../");

      messages = videos.map((video, index, self) => {
        const videoCloudPath = videoResponses[index].secure_url
        const pathSplit = videoCloudPath.split(".");
        const linkWithoutExtension = pathSplit.slice(0, pathSplit.length -1).join(".");
        const videoThumbnail = linkWithoutExtension + ".jpg";

        const isLastLoop = index === self.length - 1

        const messageParams = messageParameters({
          media: [{...video, path: videoCloudPath, thumbnail: videoThumbnail}],
          sentBy: req.session.user._id,
          text: messageText,
          chatId
        }, isReplyTo, isLastLoop && usersViewing.length, usersViewing)

        const message = isLastLoop ?
              new Message(messageParams) :
              messageParams
              
        return message;
      })
    }

    const {chatDoc, messageDoc} = await createOrUpdateChat(chatScreenId, req.session.user._id, chat, messages.pop(), {_id: chatId}, req.body.customId)
    messages = await Message.insertMany(messages).then(async messages => {
      return await Promise.all(messages.map(async msg => await populateMessage(msg)))
    })
    messages.push(messageDoc)
    console.log("Uploading videos complete")
    res.status(201).send({chat: chatDoc, messages});
  } catch(error) {
    console.log(error);
    res.status(500).send({success: false, error});
    
  }
}



async function uploadChatFiles(req, res) {
  const chatScreenId = mongoose.Types.ObjectId(req.params.id);
  const chat = req.body.chat;
  const isReplyTo = req.body.replyTo;
  const chatId = chat ? chat._id : mongoose.Types.ObjectId(req.body.customId) || new ObjectId();
  const files = req.body.files;
  let usersViewing = req.body.usersViewing;
  const username = chat.nicknames[req.session.user._id] || req.session.user.firstName;
  const messageText = `${username} sent a file.`;

  try {
    const fileBucketPromises = [];
    const currentFilePaths = [];
    for(let file of files) {
      currentFilePaths.push(file.path)
      fileBucketPromises.push(uploadToGoogleCloudBucket(file.path, "../"))
    }

    const gBucketResponses = await Promise.all(fileBucketPromises);
    await removeFiles(currentFilePaths, "../");


    const messagesArr = files.map((file, index, array) => {
      let messageParams = messageParameters({
        media: [{...file, path: gBucketResponses[index]}], sentBy: req.session.user._id, text: messageText, chatId
      }, isReplyTo, index === array.length - 1 && usersViewing.length,
      usersViewing);
      
      return messageParams
    })

    const lastMessage = new Message({...messagesArr.pop()})

    let messages = await Message.insertMany(messagesArr).then(async messages => {
      return await Promise.all(messages.map(async msg => await populateMessage(msg)))
    })

    const {chatDoc, messageDoc} = await createOrUpdateChat(chatScreenId, req.session.user._id, chat, lastMessage, {_id: chatId}, req.body.customId)

    messages.push(messageDoc);
    // console.log("MessageDoc ", messageDoc,"Messages ", messages)
    console.log("Uploading files complete")
    res.status(201).send({success: true, messages, chat: chatDoc})
  } catch(error) {
    console.log(error);
    res.status(500).send(error);
  }

    // console.log("Uploading files complete")

}

async function getChatThroughChatId(chatId, userLoggedInId, payload, cb) {
  // select either a group chat that user is part of (with that id)
  // or chat that is accessed through the other users id and contains as users, both the other user and us(the userLoggedIn)
  // using $all operator was tricky here, since chatId and userLoggedInId could be the same (aka solo chat) 
  // $all returned the first match it found, and that was not a solo chat...it was instead the first match of me and another users chat
  // $all: [me, me] satisfies the query...so it returns the first chat it finds that has ME in the users array
  // $all, you suck...
  const chat = await Chat.findOne({$or: [
    {
      $and: [
        {_id: chatId},
        {isGroupChat: true},
        {users: {$in: userLoggedInId}}
      ]
    },
    {
      $or: [
        {users: {
          $size: 2,
          $eq: [chatId, userLoggedInId]
        }},
        {users: {
          $size: 2,
          $eq: [userLoggedInId, chatId]
        }}
      ]  
    }
  ]})
  .then(async c => await populateChat(c))

  if(!chat) {
    return cb(chatId, userLoggedInId, payload, setEmptyChat)
  }

  console.log("Chat existos")
  if(!chat.isGroupChat) {
    // since chatId could likely be the other users Id
    const isOwnUsersPrivateChat = chat.users.every(user => user._id.toString() === userLoggedInId.toString())
    if(!isOwnUsersPrivateChat) {
      payload.pageTitle = setDuetChatName(chat.users, userLoggedInId)
    }
    
    chatId = chat._id;
  } else {
    const loggedInUserFirstName = chat.users.find(u => u._id.toString() === userLoggedInId.toString())
    payload.pageTitle = setGroupChatName(chat.chatName, loggedInUserFirstName, chat.nicknames);
  }
  
  const messages = await getChatMessages(chat._id, userLoggedInId);
  // since the chat is fetched first, but the seen tag is updated later
  chat.latestMessage.seen = messages[0].seen;

  return {messages, chat, userPayload: payload}
}

async function getChatMessages(chatId, userLoggedInId) {

  // find the last Message that was seen by you
  // and remove it, that way, you're not going to have multiple seen flags
  // if its not the last message.....
  const lastMessageSeenByUser = await Message.findOneAndUpdate({
    chatId,
    "seen.user": {$in: [userLoggedInId]},
    hiddenBy: {$nin: [userLoggedInId]}
  },
  {$pull: {seen: {user: userLoggedInId}}})
  console.log("Latest that was seen by a user ",lastMessageSeenByUser?.text, lastMessageSeenByUser?.seen);

  // get all the messages
  let messages = await Message.find({
    chatId,
    hiddenBy: {$nin: [userLoggedInId]}
  })
  .sort({createdAt: -1})
  .limit(messageLimit)
  .populate({path: 'sentBy', select: "firstName lastName profilePic"})
  .populate({path: 'reactions.user', select: "firstName lastName profilePic"})
  .populate({path: 'seen.user', select: "firstName lastName profilePic"})
  .populate({path: "isReplyTo", select: "text sentBy", populate: { path: "sentBy", select: "firstName lastName"}})
  

  // console.log("MESSAGES SEEN BATCH ", messages.map(m => m.seen))
  

  if(messages.length) {
    // pop the last one
    let lastMessage = messages.shift();

    let date = new Date();
    if(lastMessageSeenByUser) {
        
      if(lastMessage._id.toString() === lastMessageSeenByUser._id.toString()) {
        // if last message is the same as the one you're seeing right now
        // don't set a new Date, keep the old one
        // so your crush who re-reads your love letters won't be found
        const userLoggedInFoundInSeenArray = lastMessageSeenByUser.seen.find(seenObj => seenObj.user.toString() === userLoggedInId.toString());
        position = lastMessageSeenByUser.seen.indexOf(userLoggedInFoundInSeenArray);
        if(userLoggedInFoundInSeenArray) {
          date = new Date(userLoggedInFoundInSeenArray.at)
        }
      }
    }
    
    // so you can update it, adding the seen flag
    // Note: You don't need to add yourself as 'seen' in your own messages
    if(lastMessage?.sentBy?._id.toString() !== userLoggedInId.toString()) {
        lastMessage = await Message.findByIdAndUpdate(
          {_id: lastMessage._id, chatId},
          { $addToSet: {seen: [{user: userLoggedInId, at: date}]} },
          {new: true})
          .populate({path: 'reactions.user', select: "firstName lastName profilePic"})
          .populate({path: 'seen.user', select: "firstName lastName profilePic"})
          .populate({path: 'sentBy', select: "firstName lastName profilePic"})
          .populate({path: "isReplyTo", select: "text sentBy", populate: { path: "sentBy", select: "firstName lastName"}})
    }
    
    // push back the 'probably updated' message
    messages = [lastMessage, ...messages]
  }
  return messages
}

async function getChatThroughUsersId(chatId, userLoggedInId, payload, cb) {
  console.log("Chat not exists, retrying...")
  // since chat is certainly not a group chat
  // and it could be a 2 users chat (duet chat) that is accessed through the chatId itself (not by the other users ID)
  // keep in mind, in the front end we always access a duet chat by the other users id
  // but if (somehow) we tried to access a duet chat by the chatId
  // we'd have to query for a chat with that chatID -> find it
  // and then query again to find a chat (with that ID) that matches the users array of previously found chat
  // another solution would be to first find a user
  // and check if there's a chat that contains that user and the userLoggedIn
  // it could be more readable
  let messages = [], chat = null;
  await Chat.findOne({_id: chatId}).then(async doc => {
      if(!doc) {
        // callback is setEmptyChat
        return cb(chatId, userLoggedInId, payload);
      }
      console.log("DOC at this point ", doc)
      chat = await Chat.findOne({
        $and: [
          {_id: doc._id},
          {
            $or: [
              {users: {
                $size: 2,
                $eq: doc.users
              }},
              {users: {
                $size: 2,
                $eq: doc.users.reverse()
              }}
            ]
          }
        ]
      }).then(async c => await populateChat(c))
      
      const userIsInChat = chat.users.some(uid => uid.toString() == userLoggedInId.toString());

      if(userIsInChat) {
        const isOwnUsersPrivateChat = chat.users.every(user => user._id.toString() === userLoggedInId.toString())
        if(!isOwnUsersPrivateChat) {
          payload.pageTitle = setDuetChatName(chat.users, userLoggedInId)
        }

        messages = await getChatMessages(chat._id, userLoggedInId)
        // since the chat is fetched first, but the seen tag is updated later
        chat.latestMessage.seen = messages[0].seen;
      }
    }).catch(error => {
      console.log(error)
  })

  return {messages, chat, userPayload: payload}
}

async function setEmptyChat(chatId, userLoggedInId, payload) {
  console.log("Chat was never found")
  if(chatId.toString() !== userLoggedInId.toString()) {
    
    const user = await User.findOne({_id: chatId })
    payload.pageTitle = user ? user.firstName + " " + user.lastName : "User not found";
  } 

  return {messages: [], chat: null, userPayload: payload}
}


async function messageReaction(req, res) {
  const emoji = req.body.emoji;
  const messageId = req.body.messageId;
  const userId = req.params.userId;

  try {
    // find a message if it has YOU in its reactions
    let message = await Message.findOne({_id: messageId, "reactions.user": {$in: [userId]} })

    if(!message) {
      await Message.updateOne({_id: messageId}, {$push: {reactions: {user: userId, emoji}}}, {new: true})
      return res.status(201).send({operation: "addition"});
    }

    const isTheSameReaction = message.reactions.find(reaction => reaction.user.toString() === userId && reaction.emoji === emoji);

    if(isTheSameReaction) {
      // you take it off
      await Message.updateOne({_id: messageId}, {$pull: {reactions: {user: userId, emoji}}})
      return res.status(201).send({operation: "subtraction"});
    }

    // update the reaction emoji
    await Message.updateOne({_id: messageId, "reactions.user": userId}, {$set: {
      "reactions.$.emoji": emoji
    }})
    return res.status(201).send({operation: "addition"});
  } catch(error) {
    console.log(error)
  }
}

async function deleteMessage(req, res) {
  const messageId = req.params.id;
  const chat = req.body.chat;
  const sentBy = req.body.sentBy;

  try {
    let messageText;
    let username = setUsername(chat.nicknames, req.session.user);
    if(sentBy !== req.session.user._id) {
      messageText = `Admin ${username} deleted a message.`
    } else {
      messageText = `${username} unsent a message.`
    }
    

    const unsentMessage = await Message.findByIdAndUpdate({_id: messageId }, {text: messageText, messageType: "delete", media: []}, {new: true})
    .then(async m => await populateMessage(m))
    
    res.status(201).send({unsentMessage});
  } catch(error) {
    console.log(error);
    res.status(500).send({alert: "Something went wrong"})
  }
}

async function hideMessage(req, res) {
  const messageId = req.params.id;

  await Message.updateOne({_id: messageId}, {$push: {hiddenBy: req.session.user._id}}).then(() => {
    res.status(204).send({ success: true })
  }).catch(err => {
    console.error(err)
    res.status(500).send({alert: "Something went wrong"})
  }) 
  
}

async function fetchMoreMessages(req, res) {
  const latestMessageDate = new Date(req.query.latestMessageDate);
  const direction = req.query.direction;
  const chatId = req.params.chatId;
  
  try {
    const createdAt = {}
    if(direction === "top") {
      createdAt.$lt = latestMessageDate
    } else {
      createdAt.$gt = latestMessageDate
    }


    let messages = await fetchMessages({
      chatId: mongoose.Types.ObjectId(chatId),
      hiddenBy: {$nin: [mongoose.Types.ObjectId(req.session.user._id)]},
      createdAt: {...createdAt}
    }, direction === "top" ? -1 : 1, messageLimit)
    .then(res => {
      if(direction !== "top") return res.reverse()

      return res;
    })
    
    let fetchMoreMessages = messages.length === messageLimit;

    res.status(200).send({messages, fetchMoreMessages})
  } catch(error) {
    console.log(error);
  }
}

async function changeAdminStatus(req, res) {
  const userId = req.params.userId;
  const operation = req.body.operation;
  console.log(operation)

  try {
    if(operation === "add") {
      console.log("It is add")
      await Chat.updateOne({_id: req.body.chatId}, {$addToSet: {admin: mongoose.Types.ObjectId(userId)}}, { timestamps: false })
    } else {
      console.log("It is pull")
      await Chat.updateOne({_id: req.body.chatId}, {$pull: {admin: {$in: [userId]}}},{ timestamps: false })
    }

    res.status(204).send({});
  } catch(error) {
    console.log(error)
    res.status(500).send({alert: "Something went wrong."});
  }

}

async function addPeople(req, res) {
  const chatId = req.body.chat._id;
  const customName = req.body.chat.customName;
  const userIds = req.body.userIds;
  const userLoggedInFullName = req.session.user.firstName + " " + req.session.user.lastName;
  let messageText, firstAddedUser;
  
  try {
    if(userIds.length > 1) {
      messageText = `${userLoggedInFullName.trim()} added participants to the group.`
    } else {
      firstAddedUser = await User.findById(userIds[0]).select("firstName lastName profilePic");
      const addedUserFullName = firstAddedUser.firstName + " " + firstAddedUser.lastName;
      messageText = `${userLoggedInFullName} added ${addedUserFullName.trim()} to the group.`
    }
  
    const message = await Message.create({text: messageText, messageType: "info", chatId })
  
    if(customName) {
      // we're just updating
      await Chat.updateOne({_id: chatId}, {$push: {users: userIds}, latestMessage: message._id})
      
      return res.status(201).send({users: firstAddedUser})
    } else {
      let addedUsers;
      if(userIds.length > 1) {
        const promises = userIds.map(async (userId) => {
          const user = await User.findById(userId).select("firstName lastName profilePic");
          return user;
        })

        // You need their names to update the chat
        // But you also need the user as a whole to send it back
        // You should also send the new chatName
        addedUsers = await Promise.all(promises);
      } else {
        addedUsers = [firstAddedUser];
      }
      

      let chatName = createChatName("", [...req.body.chat.users, ...addedUsers], req.body.chat.nicknames);

      await Chat.updateOne(
        {_id: chatId},
        {
          $push: {users: userIds},
          latestMessage: message._id,
          chatName
        })


        res.status(201).send({users: addedUsers, chatName: setGroupChatName(chatName, req.session.user, req.body.chat.nicknames)})
    }
  
    // if there's no customName you'll have to change the name of the chat
  
    
  } catch(error) {
    console.log(error)
  }
}

async function removeUserFromGroupChat(req, res) {
  const chatId = req.body.chat._id;
  const customName = req.body.chat.customName;

  const removedUser = req.body.user;

  const removedUserFullName = removedUser.firstName + " " + removedUser.lastName;
  const userLoggedInFullName = req.session.user.firstName + " " + req.session.user.lastName;


  const indexOfRemovedUser = req.body.chat.users.indexOf(removedUser);
  req.body.chat.users.splice(indexOfRemovedUser, 1);
  let messageText = ""
  if(removedUser._id === req.session.user._id) {
    messageText = `${userLoggedInFullName.trim()} left the group.`
  } else {
    messageText = `${userLoggedInFullName.trim()} removed ${removedUserFullName.trim()} from the group.`
  }
  

  try {
    const message = await Message.create({chatId, messageType: "info", text: messageText})
    let newChatName = "";

    let chatUpdateFields = {
      latestMessage: message._id,
      $pull: {users: removedUser._id}
    }

    const removedUserWasAdmin = req.body.chat.admin.some(adminUserId => adminUserId === removedUser._id);
    if(removedUserWasAdmin) {
      chatUpdateFields = {
        ...chatUpdateFields,
        $pull: {admin: removedUser._id}
      }
    }
    // this func will be used both by admins that remove users and users that willfully exit the chat
    if(!customName) {
      newChatName = createChatName("", req.body.chat.users, req.body.chat.nicknames);

      chatUpdateFields = {
        ...chatUpdateFields,
        chatName: newChatName
      }
    }
    
    let updatedChat = await Chat.findByIdAndUpdate(
      {_id: chatId},
      chatUpdateFields,
      {new: true})
      .populate({ path: 'users', select: "profilePic firstName lastName" })

    
    updatedChat.chatName = setGroupChatName(updatedChat.chatName, req.session.user, req.body.chat.nicknames)
    
    res.status(201).send({updatedChat})
  } catch(error) {
    console.log(error);
    res.status(500).send({alert: "Something went wrong processing your request to the server. Please try again later."})
  }
  
}

async function setNickname(req, res) {
  const user = req.body.user;
  const userId = user._id;
  const nickname = striptags(req.body.nickname);
  if(!nickname.length) return res.status(403).send({alert: "Trying to be a smartass?"})

  const chat = req.body.chat;
  const customChatName = chat.customName;

  try {
    let messageText;
    const userLoggedInName = chat.nicknames[userId] || `${req.session.user.firstName} ${req.session.user.lastName}`.trim();
    const otherUsersName = chat.nicknames[userId] || `${user.firstName} ${user.lastName}`.trim();

    if(nickname === "") {
      messageText = req.session.user._id === userId 
      ? `${req.session.user.firstName} ${req.session.user.lastName} cleared his nickname.`
      : `${userLoggedInName} cleared the nickname of ${otherUsersName}`
      
    } else if(req.session.user._id === userId) {
      messageText = `${userLoggedInName} set his nickname to ${nickname}`
    } else {
      messageText = `${userLoggedInName} set the nickname of ${otherUsersName} to ${nickname}.`
    }

    const message = await Message.create({chatId: chat._id, text: messageText, messageType: "info"});

    let nicknamesObj = chat.nicknames || {}
    const userHasNickname = nicknamesObj.hasOwnProperty(userId);
    if(userHasNickname) {
      delete nicknamesObj[userId];
    }

    // if new nickname is an not equal to an empty string
    if(nickname !== "") {
      nicknamesObj = {...nicknamesObj, [userId]: nickname}
    }

    let chatName = customChatName ? chat.chatName : createChatName("", chat.users, nicknamesObj);

    

    await Chat.updateOne({_id: chat._id}, {$set: {nicknames: nicknamesObj}, chatName, latestMessage: message._id, updatedBy: req.session.user._id})

    console.log(nicknamesObj);

    res.status(201).send({nicknames: nicknamesObj, chatName: customChatName ? "" : setGroupChatName(chatName, req.session.user, nicknamesObj)})
  } catch(err) {
    console.error(err);
    res.status(500).send({alert: "Something went wrong."})
  }
}

async function setChatName(req, res) {
  try {
    const chat = striptags(req.body.chat);
    let newChatName = removeScriptTags(req.body.newChatName);
    if(!newChatName.length) return res.status(403).send({alert: "Don't be an asshole."});

    const username = chat.nicknames[req.session.user._id] || `${req.session.user.firstName} ${req.session.lastName}`.trim()
    let isCustom = true
    let messageText = `${username} set the chat name to ${newChatName}.`;

    if(newChatName === "") {
      newChatName = createChatName("", chat.users, chat.nicknames);
      isCustom = false;
      messageText = `${username} cleared the chat name.`
    }

    const message = await Message.create({text: messageText, messageType: "info", chatId: chat._id});

    await Chat.updateOne({_id: chat._id}, {customName: isCustom, latestMessage: message._id, chatName: newChatName, updatedBy: req.session.user._id})

    res.status(201).send({chatName: newChatName === "" ? setGroupChatName(newChatName, req.session.user, chat.nicknames) : newChatName})
  } catch(error) {
    console.error(error);
    res.status(500).send({alert: "Something went wrong"})
  }
}

async function setChatImage(req, res) {
  const chat = JSON.parse(req.body.chat);
  const chatId = chat._id;
  try {
    let chatImage = "";
    const userDirectory = createUserDirectory(req.session.user._id);
    const pathToImage = saveFile(res, req.file, userDirectory);

    const chatImageUpload = await fileUpload(pathToImage, "../")
    chatImage = chatImageUpload.secure_url;
    removeFile(path.join(__dirname, `../../${pathToImage}`))
    

    let username = chat.nicknames[req.session.user._id] || `${req.session.user.firstName} ${req.session.user.lastName}`.trim();
    let messageText = `${username} changed the group photo.`
    const message = await Message.create({text: messageText, chatId, messageType: "info"})

    await Chat.updateOne({_id: chatId}, {chatImage, latestMessage: message._id, updatedBy: req.session.user._id})

    res.status(201).send({chatImage})
  } catch(error) {
    console.log(error);
    res.status(500).send({alert: "Something went wrong with uploading your image to the server"})
  }
}

async function fetchMedia(req, res) {
  const chatId = req.params.chatId;
  const mediaType = req.params.type;
  
  let match = {$elemMatch: {mediaType: {}}}
  if(mediaType === "media") {
    match.$elemMatch.mediaType = {$in: ["image", "video"]}
  } else {
    match.$elemMatch.mediaType = {$eq: "file"}
  }

  try {
    const media = await Message.find({
      chatId,
      hiddenBy: {$nin: [req.session.user._id]},
      media: { 
       $exists: true,
       $ne: [],
       ...match
     }})
     .sort({createdAt: -1})
     .select("media")

     res.status(200).send(media)
  } catch(error) {
    console.log(error);
    res.status(500).send({alert: "Something went wrong with uploading your image to the server"})
  }

  
}

async function searchMessageById(req, res) {
  const messageId = req.params.id;
  const chatId = req.query.chatId;
  let currentTopMessage, currentTopMessageDate;
  if(req.query.topMessage) {
    currentTopMessage = JSON.parse(req.query.topMessage)
    currentTopMessageDate = new Date(currentTopMessage.createdAt);
  }
  

  try {
    const searchedMessage = await Message.findById(messageId).then(async m => await populateMessage(m));
    const searchedMessageDate = new Date(searchedMessage?.createdAt)

    
    let createdAtQuery = {}
    if(currentTopMessage) {
      createdAtQuery = {$gt: searchedMessageDate, $lt: currentTopMessageDate}
    } else {
      createdAtQuery = {$gt: searchedMessageDate}
    }

    let messagesInBetween = await fetchMessages({
      chatId,
      createdAt: createdAtQuery,
      hiddenBy: {$nin: [req.session.user._id]},
    }, 1, messageLimit - 1)
    .then(res => res.reverse());


    if(messagesInBetween.length + 1 < messageLimit) {

      const moreMessages = await fetchMessages(
        {
          chatId,
          createdAt: {$gt: new Date(messagesInBetween[0].createdAt)},
          hiddenBy: {$nin: [req.session.user._id]},
        },
        1,
        messagesInBetween.length + 1 - messageLimit
      )

      messagesInBetween = [...moreMessages.reverse(), ...messagesInBetween]
    }

    res.status(200).send({newMessages: [...messagesInBetween, searchedMessage]})
  } catch(error) {
    console.log(error);
  }
}

async function searchMessagesByKeyword(req, res) {
  const keywords = req.params.keywords.trim();
  const chatId = req.query.chatId;

  try {
    if(keywords.length <= 1) {
      return res.status(200).send({searchedMessages: []})
    }

    const messages = await Message.find({
      chatId,
      hiddenBy: {$nin: [req.session.user._id]},
      messageType: {$eq: "regular"},
      text: {$regex: keywords, $options: "i"}
    })
    .sort({createdAt: -1})

    console.log(messages.map(m => m.text))
    res.status(200).send({searchedMessages: messages})
  } catch(error) {
    console.log(error);
    res.status(500).send({alert: "Something went wrong. Please try again later"})
  }
}


async function updateSeenFlag(req, res) {
  const chat = req.body.chat;
  let latestMessage = chat.latestMessage;
  const latestMessageId = chat.latestMessage._id;

  try {
    
    const userHasSeenMessage = chat.latestMessage.seen.some(seenObj => seenObj.user._id === req.session.user._id);
    // latestMessaege could be an info one, which has no sentBy details
    const senderIsYou = chat.latestMessage.sentBy?._id === req.session.user._id;

    if(!userHasSeenMessage && !senderIsYou) {
      await removeSeenFlagFromPreviousMessages([req.session.user._id], chat._id);

      latestMessage = await Message.findByIdAndUpdate(
        {_id: latestMessageId },
        { $addToSet: {seen: [{user: req.session.user._id, at: new Date()}]}
      }, 
      {new: true})
      .then(async m => await populateMessage(m));
      
    }
    
    res.status(201).send({updatedMessage: latestMessage})
  } catch(error) {
    console.log(error);
    res.status(500).send({alert: "Something went wrong. Please try again later"})
  }
  
}


module.exports = { 
  newChat,
  getUserChats,
  uploadChatImages,
  uploadChatVideos,
  uploadChatFiles,
  sendTextMessage,
  getChatThroughChatId,
  getChatThroughUsersId,
  setEmptyChat,
  messageReaction,
  deleteMessage,
  hideMessage,
  fetchMoreMessages,
  changeAdminStatus,
  addPeople,
  removeUserFromGroupChat,
  setNickname,
  setChatName,
  setChatImage,
  fetchMedia,
  searchMessageById,
  searchMessagesByKeyword,
  updateSeenFlag
}