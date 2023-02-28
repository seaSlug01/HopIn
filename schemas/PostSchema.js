const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    content: { type: String, trim: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    shareUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    shareData: { type: Schema.Types.ObjectId, ref: 'Post' },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Post' },
    replyCount: {type: Number, default: 0},
    media: [{
      encoding: String,
      filename: String,
      mimetype: String,
      originalname: String,
      path: String,
      size: Number,
      thumbnail: {type: Schema.Types.Mixed, default: false},
      mediaType: String,
      credits: {type: Schema.Types.Mixed},
      subs: {type: String, trim: true},
      sensitiveContent: [{type: String}],
      alt: {type: String, trim: true}
    }],
    mentions: [
      {
        name: { type: String, trim: true },
        userData: {type: Schema.Types.ObjectId, ref: 'User'}
      }
    ],
    pinned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
