const express = require('express');
const app = express();
const router = express.Router();
const mongoose = require("mongoose");
const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');
const moment = require("moment");



router.get('/', (req, res, next) => {
  let payload = {
    pageTitle: req.session.user.username,
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
    profileUser: req.session.user
  };

  res.status(200).render('profilePage', payload);
});

router.get('/:username', async (req, res, next) => {
  try {
    const payload = await getPayload(req.params.username, req.session.user)
    const pageRendered = payload.profileUser._id !== null && mongoose.Types.ObjectId.isValid(payload.profileUser._id) ? "profilePage" : "userNotFound";
    let statusCode = payload.profileUser._id !== null && mongoose.Types.ObjectId.isValid(payload.profileUser._id) ? 200 : 404;
    res.status(statusCode).render(pageRendered, payload);
  } catch(error) {
    console.log(error)
    res.status(500).send("Something went wrong. Maybe the server is down temporarily. Try again later.")
  }
});

router.get('/:username/shares-replies', async (req, res, next) => {
  const payload = await getPayload(req.params.username, req.session.user)

  res.status(200).render('profilePage', payload);
});


router.get('/:username/likes', async (req, res, next) => {
  const payload = await getPayload(req.params.username, req.session.user)

  res.status(200).render('profilePage', payload);
});

router.get('/:username/posts', async (req, res, next) => {
  const payload = await getPayload(req.params.username, req.session.user)

  res.status(200).render('profilePage', payload);
});

router.get('/:username/following', async (req, res, next) => {
  const payload = await getPayload(req.params.username, req.session.user)

  res.status(200).render('followersAndFollowing', payload);
});

router.get('/:username/followers', async (req, res, next) => {
  const payload = await getPayload(req.params.username, req.session.user)

  res.status(200).render('followersAndFollowing', payload);
});

async function getPayload(username, userLoggedIn) {

  let user = await User.findOne({ username }).collation( { locale: "en_US", strength: 1 } )
  // collation strength is for ignoring uppercase/lowercase, strength can go up to 2
  // although locale is en_US, it seems to work for greek characters too
  if (!user) {
    // Check if it is an ObjectId
    console.log("Could not find by name")
    if(mongoose.Types.ObjectId.isValid(username)) {
      user = await User.findById(username);
    }
  }
  
  if (!user) {
    console.log("Could not find by id")
    return {
    pageTitle: "Profile",
    userLoggedIn: userLoggedIn,
    userLoggedInJs: JSON.stringify(userLoggedIn),
    profileUser: { _id: null, username }
    }
  }


  return {
    pageTitle: user.firstName + " " + user.lastName,
    userLoggedIn: userLoggedIn,
    userLoggedInJs: JSON.stringify(userLoggedIn),
    profileUser: { ...user._doc, createdAt: moment(new Date(user.createdAt)).format("MMMM yyyy") }
  }

  
}

module.exports = router;
