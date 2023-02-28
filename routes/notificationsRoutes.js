const express = require('express');
const router = express.Router();
const Notifications = require("../schemas/NotificationSchema.js");

router.get('/', async (req, res) => {

  const notifications = await Notifications.find({userTo: req.session.user._id}).sort({createdAt: -1}).populate({path: "userFrom"})

  let payload = {
    pageTitle: 'Notifications',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
    notifications: JSON.stringify(notifications)
  };

  res.status(200).render('notificationsPage', payload);
});



module.exports = router;