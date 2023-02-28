const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const HashtagSchema = new Schema(
  {
    name: { type: String, trim: true },
    userId: {type: Schema.Types.ObjectId, ref: 'User'}
  }
);

const HashTag = mongoose.model('HashTag', HashtagSchema);
module.exports = HashTag;
