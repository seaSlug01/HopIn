const mongoose = require('mongoose')
const validate = require('mongoose-validator')
const Schema = mongoose.Schema

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Name cannot be blank"],
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    profilePic: { type: String, default: '/images/profilePic.png' },
    coverPic: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    shares: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    searchHistory: [{
      id: String,
      views: Number,
      searchType: String,
      createdAt: {type: Date, default: new Date()},
      additionalData: {type: Schema.Types.Mixed},
    }],
    bio: {
      type: String,
      trim: true,
      maxLength: 150
    },
    location: {
      type: String,
      trim: true,
      maxLength: 30
    },
    website: {
      type: String,
      trim: true,
      maxLength: 150
    },
    birthDate: {
      date: {
        type: Date,
        default: new Date(),
        validate: (input) => {
           if(new Date(input) > new Date()) {
             throw new Error("Birthdate cannot be more than current date")
           }
        }
      },
      canSeeMonthAndDay: {
        default: "onlyYou",
        type: String,
        trim: true
      },
      canSeeYear: {
        default: "onlyYou",
        type: String,
        trim: true
      }
    }
  },
  { timestamps: true }
)

const User = mongoose.model('User', UserSchema)
module.exports = User
