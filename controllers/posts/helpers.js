const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const HashTag = require('../../schemas/HashtagSchema');
const Notification = require("../../schemas/NotificationSchema");
const {fileUpload, directoryPath, uploadToGoogleCloudBucket} = require("../utils.js");
const cloudinary = require("cloudinary").v2;


const uploadMedia = async (media) => {
  if(media.length) {
    const mediaType = media[0].mediaType;

    if(mediaType === "image" || mediaType === "video") {
      
      for(let item of media) {
        if(item.sensitiveContent) {
          // sensitive content is originally an object with booleans for each category
          // I dont need the booleans
          // And I'm safer with an array of strings rather than a Schema.Types.Mixed object
          item.sensitiveContent = Object.keys(item.sensitiveContent);
        }

        if(item.mediaType === "image" && item.newPath) {
          // newPath means the image has been cropped
          // I want the cropped one as the path
          // actually I wanna upload this stuff

          item.path = item.newPath;
        }
      }

    } // end 

    if(mediaType === "image") {
      const uploadPromise = await Promise.all(media.map(image => cloudinary.uploader.upload(directoryPath(image.path, "../"))))
      

      for(let i = 0; i <= media.length - 1; i++) {
        media[i].path = uploadPromise[i].secure_url;
      }
      
      return media;
    } // end

    if(mediaType === "video") {

      const toCloud = await fileUpload(media[0].path, "../", { resource_type: "video" })
      const videoPath = toCloud.secure_url;
      const splitSURL = videoPath.split(".");
      const linkWithoutExtension = splitSURL.slice(0, splitSURL.length -1).join(".");

      media[0].path = videoPath;
      media[0].thumbnail = linkWithoutExtension + ".jpg";

      if(media[0].subs) {
        const newSubsPath = await uploadToGoogleCloudBucket(media[0].subs, "../");
        media[0].subs = newSubsPath;
      }
      
    }

  }

  return media;
}

function mediaItemsHaveTheSameMediaType(media) {
  const type = media[0].type;
  return media.every(m => m.mediaType === type)
}

async function getPosts(filter, sortedBy, limit) {

  var results = await Post.find(filter)
  .populate({ path: 'postedBy', select: "firstName lastName username profilePic followers following bio location" })
  .populate("shareData")
  .populate("replyTo")
  .populate({ path: "mentions.userData", select: "firstName lastName username profilePic followers following bio location"})
  .sort(sortedBy)
  .limit(limit)
  .catch(error => console.log(error))

  results = await User.populate(results, { path: "shareData.postedBy" })
  results = await User.populate(results, { path: "replyTo.postedBy" });

  return results
}

async function insertHashTags(hashTags) {
  if(hashTags && hashTags.length) {
    console.log(hashTags)

    const hashTagsMap = [...new Set([...hashTags])].map(tag => {
      return {name: tag}
    })

    // ordered: false will skip duplicates, but if the batch itself has duplicates the first time, it will insert them
    // so you need a Set
    await HashTag.insertMany(hashTagsMap, {ordered: false})
  }
}

async function findMentionedUsers(mentionedUsers) {
  for await(let user of mentionedUsers) {
    await User.findOne({
      username: user.name.trim()
    })
    .then(userFound => {
      if(userFound !== null && userFound !== undefined) {
        // userData is going to be populated using the Id
        user.userData = userFound._id
      }
    })
    .catch(err => console.log(err))
  }

  console.log(mentionedUsers)
  return mentionedUsers;
}

async function sendNotificationToMentionedUsers(loggedInUserId, post) {

  const mentionedUsersNotificationPromise = post.mentions
    .filter((user, index, self) =>
      // filtering duplicate users and nonexistant users (without userId) 
      index === self.findIndex((item) => (
        item.name === user.name
      )) && user.userData?._id)
    .map(user => Notification.insertNotification(user.userData._id, loggedInUserId, "mention", post._id))
  console.log(mentionedUsersNotificationPromise)

  mentionedUsersNotificationPromise.length && await Promise.all(mentionedUsersNotificationPromise);
}



module.exports = { getPosts, insertHashTags, uploadMedia, mediaItemsHaveTheSameMediaType, sendNotificationToMentionedUsers, findMentionedUsers }