const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  admin: [{ type: Schema.Types.ObjectId }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  nicknames: {type: Schema.Types.Mixed, default: {}},
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }, 
  isGroupChat: {type: Boolean, default: false },
  chatName: String,
  customName: Boolean,
  chatImage: String,
  latestMessage: {type: Schema.Types.ObjectId, ref: 'Message'},
  users: [{type: Schema.Types.ObjectId, ref: 'User'}]
},
{
  timestamps: true,
  minimize: false
})

// minimize: false because it just doesn't store empty objects, even 'default' cases

const Chat = mongoose.model("Chat", ChatSchema);
module.exports = Chat;