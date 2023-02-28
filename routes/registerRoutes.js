const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res) => {
  const payload = req.body;
  payload.page = 1;
  payload.error = false;
  res.status(200).render('register', payload);
});

router.post('/', async (req, res) => {
  let firstName = req.body.firstName.trim();
  let lastName = req.body.lastName.trim();
  let username = req.body.username.trim();
  let email = req.body.email.trim();
  let password = req.body.password;

  const payload = req.body;
  if (firstName && lastName && username && email && password) {
    const user = await User.findOne({
      $or: [{username: { $regex: username, $options: "i"}}, { email: email }]
    }).catch(err => {
      console.error(err.message);

      payload.errorMessage = 'Something went wrong.';
      res.status(200).render('register', payload);
    });

    if (user == null) {
      // No user found
      const data = req.body;

      data.password = await bcrypt.hash(password, 10);

      User.create(data).then(user => {
        req.session.user = user;
        return res.redirect('/');
      });
    } else {
      // User found
      if (email == user.email && username == user.username) {
        payload.errorMessage = 'Username and email already in use.';
        payload.page = 2;
        payload.error = true;
        payload.errorFields = 'username, email';
      } else if (email == user.email) {
        payload.errorMessage = 'Email already in use.';
        payload.page = 2;
        payload.error = true;
        payload.errorFields = 'email';
      } else {
        payload.errorMessage = 'Username already in use.';
        payload.page = 2;
        payload.error = true;
        payload.errorFields = 'username';
      }

      res.status(200).render('register', payload);
    }
  } else {
    payload.errorMessage = 'Make sure each field has a valid value';
    res.status(200).render('register', payload);
  }
});

module.exports = router;
