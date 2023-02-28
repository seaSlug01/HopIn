const mongoose = require("mongoose");

const Schema = mongoose.Schema;



const MessageSchema = new Schema(
  {
    sentBy: {type: Schema.Types.ObjectId, ref: 'User'},
    text: String,
    media: [{
      encoding: String,
      filename: String,
      mimetype: String,
      originalname: String,
      path: String,
      size: Number,
      thumbnail: {type: Schema.Types.Mixed, default: false},
      mediaType: String,
      duration: Number
    }],
    isReplyTo: {type: Schema.Types.ObjectId, ref: 'Message'},
    hiddenBy: [{type: Schema.Types.ObjectId}],
    seen: [{ _id: false, user: {type: Schema.Types.ObjectId, ref: 'User'}, at: {type: Date}}],
    reactions: [{ _id: false, user: {type: Schema.Types.ObjectId, ref: 'User'}, emoji: String }],
    chatId: {type: Schema.Types.ObjectId, ref: "Chat"},
    messageType: {type: String, default: "regular"}
  },
  {timestamps: true}
)

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;