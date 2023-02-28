const requireLogin = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

const sendingMessageCreatesChat  = (req, res, next) => {
  next();
}

const errorHandler = (error, req, res, next) => {
  console.log(error);
  res.status(500).send(error);
}

module.exports = { requireLogin, sendingMessageCreatesChat, errorHandler }
