const express = require('express');
const app = express();
const router = express.Router();
const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');

app.set('view engine', 'pug');
app.set('views', 'views');

router.get('/', (req, res, next) => {
  res.status(200).render('login');
});

router.post('/', async (req, res, next) => {
  const payload = req.body;

  if (req.body.logUsername && req.body.logPassword) {
    const user = await User
      .findOne({
        $or:
          [{ username: req.body.logUsername }, { email: req.body.logUsername }]
      }).catch(err => {
        console.log(err.message);

        payload.errorMessage = 'Something went wrong.';
        payload.error = true;
        res.status(200).render('login', payload);
      });

    if (user !== null) {
      const result = await bcrypt.compare(req.body.logPassword, user.password);

      if (result) {
        req.session.user = user;
        return res.redirect('/');
      }
    }

    payload.errorMessage = 'Login credentials incorrect.';
    payload.error = true;
    return res.status(200).render('login', payload);
  }

  payload.errorMessage = 'Make sure each field has a valid value.';
  payload.error = true;
  res.status(200).render('login');
});

module.exports = router;
