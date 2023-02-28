const {config} = require('dotenv');
config();

const express = require('express');
const app = express();
const devPORT = 3003;
const middleware = require('./middleware');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const database = require("./database");




// Routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const logoutRoute = require('./routes/logout');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const uploadRoute = require('./routes/uploadRoutes');
const searchRoute = require("./routes/searchRoutes");
const messagesRoute = require("./routes/messagesRoutes");
const notificationsRoute = require("./routes/notificationsRoutes");

// API Routes
const postsApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');
const chatsApiRoute = require('./routes/api/chats');
const emojisApiRoute = require('./routes/api/emoji');
const giphyApiRoute = require("./routes/api/giphy");
const notificationsApiRoute = require("./routes/api/notifications");


const { requireLogin } = middleware;

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET
})

const server = app.listen(process.env.PORT || devPORT, () =>
  console.log('Server listening on port ' + devPORT)
);

const io = require("socket.io")(server, {pingTimeout: 60000})

app.set('view engine', 'pug');
app.set('views', 'views');


app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(path.join(__dirname, '/public')));
app.use('/scripts', express.static(__dirname + '/node_modules'));

// app.use(
//   session({
//     secret: 'bbq chips',
//     resave: true,
//     saveUninitialized: false
//   })
// );

app.use(session({
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 } ,
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  store:  MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collection: 'hop_in_sessions' //default - sessions
  })
}));

// Use the routes
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/logout', logoutRoute);
app.use('/posts', requireLogin, postRoute);
app.use('/profile', requireLogin, profileRoute);
app.use('/uploads', requireLogin, uploadRoute);
app.use('/search', requireLogin, searchRoute);
app.use('/messages', requireLogin, messagesRoute);
app.use('/notifications', requireLogin, notificationsRoute);

app.use('/api/posts', postsApiRoute);
app.use('/api/users', usersApiRoute);
app.use('/api/chats', chatsApiRoute);
app.use('/api/emojis', emojisApiRoute);
app.use("/api/giphy", giphyApiRoute);
app.use("/api/notifications", notificationsApiRoute);


// function doWork(duration) {
//   const start = Date.now();
//   while(Date.now() - start < duration) {
//   }
// }

app.get('/', requireLogin, (req, res, next) => {
  let payload = {
    pageTitle: 'Home',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user)
  };

  res.status(200).render('home', payload);
});

io.on("connection", (socket) => {
  
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  })

  socket.on("userJoinedChatRoom", ({room, userId}) => {
    socket.join(room._id);
    socket.in(room._id).emit("userJoinedChatRoom", {room, userId});
  })
  socket.on("userExitedChatRoom", ({room, userId}) => socket.in(room).emit("userExitedChatRoom", userId))
  socket.on("userIsTyping", chatDetails => socket.in(chatDetails.chat._id).emit("userIsTyping", chatDetails))
  socket.on("userStoppedTyping", chatDetails => socket.in(chatDetails.chat._id).emit("userStoppedTyping", chatDetails))
  // socket.on("userSeenLatestMessage", roomDetails => socket.in(roomDetails.chatId).emit("userSeenLatestMessage", roomDetails))
  socket.on("userSeenMessage", room => socket.in(room.chatId).emit("userSeenMessage", room))


  socket.on("newMessage", chatRoomData => {
    const {chat, senderId } = chatRoomData

    if(!chat.users) return console.log("Chat.users are not defined");

    chat.users.forEach(user => {
      if(user._id === senderId) return;
      socket.in(user._id).emit("messageReceived", chatRoomData);
    })
  })

})


