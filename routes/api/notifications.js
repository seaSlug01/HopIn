const express = require('express');
const router = express.Router();
const Notification = require("../../schemas/NotificationSchema.js");
const Chat = require("../../schemas/ChatSchema.js");


async function asyncWrapper(cb) {
  try {
    await cb();
  } catch(error) {
    console.log(error)
  }
}

router.get("/", async (req, res) => {
  await asyncWrapper(async () => {
    const notificationsCount = await Notification.find({userTo: req.session.user._id, opened: false}).countDocuments();

    const userMessages = await Chat.find({users: {$in: req.session.user._id}}).populate({path: "latestMessage"})

    const unreadMessagesCount = userMessages.filter(c => 
      c.latestMessage.sentBy.toString() !== req.session.user._id 
      && !c.latestMessage.seen.some(seenObj => 
        seenObj.user.toString() === req.session.user._id))
      .length

    res.status(200).send({notifications: notificationsCount, messages: unreadMessagesCount})
  })
})

router.put("/:notificationId", async (req, res) => {
  console.log("notification id is ", req.params.notificationId);
  const id = req.params.notificationId;

  try {
    if(id === "all") {
      await Notification.updateMany({userTo: req.session.user._id, opened: false}, {opened: true})
    } else {
      await Notification.updateOne({_id: req.params.notificationId}, {opened: true})
    }

    res.sendStatus(201);
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
})



module.exports = router;