const express = require('express');
const router = express.Router();
const User = require('../../schemas/UserSchema');
const Notification = require("../../schemas/NotificationSchema");
const { createEditUserObject } = require('../../controllers/users');

const fieldsNeeded = {username: 1, firstName: 1, lastName: 1, profilePic: 1};

router.get("/friends", async (req, res) => {
  const userLoggedInId = req.session.user._id

  try {
    const friends = await User.find({_id: {$ne: userLoggedInId}, followers: {$in: [userLoggedInId]}, following: {$in: [userLoggedInId]}}, fieldsNeeded);

    res.status(200).send(friends)
  } catch(error) {
    console.log(error);
  }
})

router.get("/fans", async (req, res) => {
  try {
    const userLoggedInId = req.session.user._id;
    const fans = await User.find({_id: {$ne: userLoggedInId}, following: {$in: [userLoggedInId]}, followers: {$nin: [userLoggedInId]}}, fieldsNeeded);

    res.status(200).send(fans)
  } catch(error) {
    console.log(error); 
  }
})

router.get("/youFollow", async (req, res) => {
  const userLoggedInId = req.session.user._id;
  const fans = await User.find({_id: {$ne: userLoggedInId}, following: {$nin: [userLoggedInId]}, followers: {$in: [userLoggedInId]}}, fieldsNeeded);

  res.status(200).send(fans)
})

router.get("/suggestions", async (req, res) => {
  // suggestions are people that are friends with your friends
  const userLoggedInId = req.session.user._id;
  const userLoggedInFollowers = req.session.user.followers;
  const userLoggedInFollowing = req.session.user.following;

  const suggestions = await User.find({
    _id: {$ne: userLoggedInId},
     following: {$nin: [userLoggedInId], $in: [...userLoggedInFollowing]}, 
     followers: {$nin: [userLoggedInId], $in: [...userLoggedInFollowers]}},
     fieldsNeeded);

  res.send(suggestions);
})

router.get("/suggestions", async (req, res) => {
  const userLoggedInId = req.session.user._id;
  const fans = await User.find({_id: {$ne: userLoggedInId}, following: {$nin: [userLoggedInId], followers: {$in: [userLoggedInId]}}});

  res.status(200).send(fans)
})

router.put("/:userId/follow", async (req, res, next) => {
  const userId = req.params.userId;

  const user = await User.findById(userId);

  if (!user) return res.sendStatus(404);


  const isFollowing = user.followers && user.followers.includes(req.session.user._id)
  let option = isFollowing ? "$pull" : "$addToSet"

  if(!isFollowing) {
    await Notification.insertNotification(userId, req.session.user._id, "follow", userId)
  }

  // this should get in try catch block
  // if there's an error in any of those operations, both should be cancelled
  req.session.user = await User.findByIdAndUpdate(req.session.user._id, { [option]: { following: userId } }, { new: true })
    .catch(error => {

      console.log(error);
      res.sendStatus(400);
    })

  const followedUser = await User.findByIdAndUpdate(userId, { [option]: { followers: req.session.user._id } }, { new: true })
    .catch(error => {
      console.log(error);
      res.sendStatus(400);
    })

  res.status(200).send({you: req.session.user, followedUser})
})

router.get("/:userId/followers", (req, res, next) => {
  // Gives the whole user tho, and populates the data of his followers
  User.findById(req.params.userId)
    .populate("followers")
    .then(results => {
      res.status(200).send(results)
    })
    .catch(error => {
      console.log("Something went wrong");
      res.sendStatus(400);
    })
})

router.get("/:userId/following", (req, res, next) => {
  // same here
  User.findById(req.params.userId)
    .populate("following")
    .then(results => {
      res.status(200).send(results)
    })
    .catch(error => {
      console.log("Something went wrong");
      res.sendStatus(400);
    })
})


router.get("/:userId", (req, res, next) => {
  User.findById(req.params.userId)
    .then(user => {
      res.status(200).send(user)
    })
    .catch(error => {
      console.log("Something went wrong");
      res.sendStatus(400);
    })
})

router.put("/:userId/edit", async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const valuesToBeSent = await createEditUserObject(req.body);
    
    req.session.user = await User.findOneAndUpdate({_id: userId}, {$set: valuesToBeSent}, { runValidators: true, new: true });
    // 204 indicates that a request has succeeded, but that the client doesn't need to navigate away from its current page.
    res.sendStatus(204)
  } catch(error) {
    
    if(error.name === "ValidationError") {
      return res.status(400).json({success: false, error })
    }
    console.log(error)
    res.status(500).send("Something went wrong");
  }  
})






module.exports = router;