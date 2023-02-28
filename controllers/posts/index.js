const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const HashTag = require('../../schemas/HashtagSchema');
const Notification = require("../../schemas/NotificationSchema");
const striptags = require('striptags');
const { getPosts, insertHashTags, uploadMedia, sendNotificationToMentionedUsers, findMentionedUsers } = require("./helpers.js");


const getSinglePost = async (req, res, next) => {
  const postId = req.params.id;
  const repliesLimit = req.query.limit ?? 5;
  let postData = await getPosts({ _id: postId });
  postData = postData[0]

  const results = {
    postData
  }

  if (postData.replyTo !== undefined) {
    results.replyTo = postData.replyTo
  }

  results.replies = await getPosts({ replyTo: postId }, {createdAt: -1}, repliesLimit)
  res.status(200).send(results);
}

const getPost = async (req, res) => {
  const filter = req.query;
  const selectedUserData = "firstName lastName username profilePic followers following"

  const post = await Post.findOne(filter)
                .populate({path: "postedBy", select: selectedUserData})
                .populate({path: "replyTo", populate: { path: "postedBy", select: selectedUserData}})
                .populate({path: "shareData", populate: { path: "postedBy", select: selectedUserData}})
                .populate({path: "mentions.userData"})
                

    console.log(post)

  return res.status(200).send(post);
}

const fetchPosts = async (req, res) => {
  // searchObj is the parameters you added in the GET request
  // on the front end, you add them like this: { params: { followingOnly: true } }
  // although you don't really need to define "params" to the data obj you send, you can have access to req.query.params
  // mind the "params" thingy --> old


  await Post.deleteMany({postedBy:req.session.user._id, shareData: {$exists: true}})
  const searchObj = req.query;
  const limit = parseInt(searchObj.limit) ?? 5;
  const postFromUsersFollowing = searchObj.followingOnly && searchObj.followingOnly == "true";
  let searchFilter = searchObj.filter ? JSON.parse(searchObj.filter) : {}
  let sortedBy = {createdAt: -1}
  const replyTo = searchObj.replyTo;

  // const pinnedPosts = await Post.find({postedBy: req.session.user._id, pinned: true})
  // console.log(pinnedPosts)

  if(replyTo) {
    searchFilter = {
      ...searchFilter,
      replyTo
    }
  }


  if(searchObj.dateIndex) {
    const dateIndex = new Date(searchObj.dateIndex);
    searchFilter = {...searchFilter, 
      createdAt: {$lt: dateIndex}
    }
  }
  

  // SHOW POSTS FROM PEOPLE YOURE FOLLOWING (YOURSELF INCLUDED, even tho you're not following yourself)
  if(postFromUsersFollowing) {
    let objectIds = [];

    if(!req.session.user.following) {
      req.session.user.following = []
    }
    req.session.user.following.forEach(user => {
      objectIds.push(user);
    })
    
    objectIds.push(req.session.user._id);

    searchFilter.postedBy = { $in: objectIds }
  }

  // DONT SHOW SHARED POSTS? BUT WHY? 
  if (searchObj.share == "false") {
    searchFilter = {...searchFilter, $and: [{ shareData: { $exists: false } }, { replyTo: { $exists: false } }, { postedBy: searchObj.postedBy }] }
  }


  // SHOW POSTS THE USER HAS REPLIED TO AND ALSO POSTS THAT HE SHARED
  if (searchObj.isReply && searchObj.share) {
    let isReply = searchObj.isReply

    searchFilter = {
      ...searchFilter,
      $or: [
        { $and: [{ replyTo: { $exists: isReply } }, { postedBy: searchObj.postedBy }] },
        {
          $and: [{ shareUsers: { $in: [searchObj.postedBy] } }, { postedBy: { $ne: [searchObj.postedBy] } }]
        }
      ]
    }
  }

  // SHOW POSTS THE USER LIKED
  if (searchObj.likes) {

    searchFilter = {
      ...searchFilter,
      likes: {
        $in: [searchObj.likedBy]
      }
    }
  }

  try {
    var posts = await getPosts(searchFilter, sortedBy, limit);
    // console.log(posts.map(p => p.content))
    res.status(200).send(posts);
  } catch(error) {
    console.log(error)
  }
}

const createPost = async (req, res) => {

  if(!req.body.content && !req.body.media.length && !mediaItemsHaveTheSameMediaType(req.body.media)) {
    return res.sendStatus(400);
  }

  try {
    var postData = {
      content: striptags(req.body.content),
      postedBy: req.session.user._id, 
      media: await uploadMedia(req.body.media),
      mentions: await findMentionedUsers(req.body.mentions)
    };
  
    console.log(postData.media)
    
  
    if (req.body.replyTo) {
      postData.replyTo = req.body.replyTo;
      await Post.updateOne({_id: postData.replyTo}, {$inc: {replyCount: 1}})
    }
  
    await Post.create(postData)
      .then(async newPost => {
        newPost = await User.populate(newPost, { path: 'postedBy', select: "firstName lastName username profilePic followers following" });
        newPost = await User.populate(newPost, {path: "mentions.userData"})

        if (newPost.replyTo) {
          newPost = await Post.populate(newPost, { path: "replyTo", select: "postedBy replyCount" });
          newPost = await User.populate(newPost, { path: "replyTo.postedBy" })
          
          // send notification to the user you've replied to
          await Notification.insertNotification(newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id)
        }

        await sendNotificationToMentionedUsers(req.session.user._id, newPost)

        // the hashtags of the post have nothing to do with the post Schema
        // they have their own schema
        await insertHashTags(req.body.hashTags);
        
        res.status(201).send(newPost);
      })
      .catch(err => console.error(err.message), res.status(400));
  } catch(error) {
    console.log(error)
    res.status(500).send(error);
  }

}

const likePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.user._id;
  // const isLiked = req.session.user.likes && req.session.user.likes.includes(postId);
  // console.log(req.data)
  const isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

  let option = isLiked ? "$pull" : "$addToSet";

  req.session.user = await User.findByIdAndUpdate(userId, { [option]: { likes: postId } }, { new: true }).catch(error => {
    console.log(error);
    res.sendStatus(400);
  })

  // Insert post like
  await Post.findByIdAndUpdate(postId, { [option]: { likes: userId } }, { new: true }).then(async newPost => {
    newPost = await User.populate(newPost, { path: 'postedBy'});

    if (newPost.replyTo) {
      newPost = await Post.populate(newPost, { path: "replyTo", select: "postedBy" });
      newPost = await User.populate(newPost, { path: "replyTo.postedBy" })
    }

    if(isLiked) {
      await Notification.deleteNotification(newPost.postedBy._id, userId, "like", postId)
    } else {
      await Notification.insertNotification(newPost.postedBy._id, userId, "like", postId)
    }
    

    res.status(201).send(newPost);
  })

}

const sharePost = async (req, res, next) => {
  const postId = req.params.id;

  const userId = req.session.user._id;
  // Try to delete share
  const deletedPost = await Post.findOneAndDelete({ postedBy: userId, shareData: postId }).catch(error => {
    console.log(error);
    res.sendStatus(400)
  })

  let option = deletedPost != null ? "$pull" : "$addToSet";

  let share = deletedPost;

  if (deletedPost) {
    share = await share.populate({path: "shareData", select: "postedBy"}).execPopulate();
    await Notification.deleteNotification(share.shareData.postedBy, userId, "share", share.shareData._id)
  } else {
    share = await Post.create({ postedBy: userId, shareData: postId }).then(async sharedPost => {
      sharedPost = await sharedPost.populate({path: "shareData", select: "postedBy"}).execPopulate();
      await Notification.insertNotification(sharedPost.shareData.postedBy, userId, "share", sharedPost.shareData._id)

      return sharedPost
    }).catch(error => {
      console.log(error);
      res.sendStatus(400)
    })
  }
  req.session.user = await User.findByIdAndUpdate(userId, { [option]: { shares: share._id } }, { new: true })

  const post = await Post.findByIdAndUpdate(postId, { [option]: { shareUsers: userId } }, { new: true })

  res.status(200).send(post);
}

const pinPost = async (req, res) => {
  const postClicked = await Post.findById(req.params.id);
  const isPinnedPost = postClicked.pinned;


  // An den einai pinned, psaxnw na dw an yparxei kapoio allo pinned post
  let currentPinnedPost, newPin;
  if(!isPinnedPost) {
    currentPinnedPost = await Post.findOneAndUpdate({ pinned: true, postedBy: req.session.user._id }, {pinned: false});
    newPin = await Post.findByIdAndUpdate(req.params.id, { pinned: true }, {new: true});

    return res.status(200).send({ oldPinId: currentPinnedPost?._id || null, newPin })
  }

  newPin = await Post.findByIdAndUpdate(req.params.id, { pinned: !isPinnedPost }, {new: true});
  
  res.status(200).send({ oldPinId: newPin._id, newPin });
}

const deletePost = async (req, res, next) => {
  await Post.findByIdAndDelete(req.params.id).then(async (post) => {
    // deleting any posts that replied to the original or posts that shared it
    await Post.deleteMany({$or: [
      {replyTo: post._id},
      {shareData: post._id}
    ]})
    res.sendStatus(200)
  }).catch(error => {
    console.log(error);
    res.sendStatus(400);
  })
}

const displayRecommendedTagsList = async (req, res) => {
  let tag = req.query;
  let recommendedTags;
  let Model = tag.tagName === "hashtag" ? HashTag : User;
  let field = tag.tagName === "hashtag" ? "name" : "username";
  let startsWithWordRegSymbol = tag.tagName === "hashtag" ? "^" : "";

  try {
    recommendedTags = await Model.find({[field]: { $regex: `${startsWithWordRegSymbol}${tag.word.substring(1)}`, $options: "i"}}).limit(8);
   
    res.status(200).send({recommendedTags});
  } catch(error) {
    console.log(error);
  }
}

module.exports = { createPost, fetchPosts, getSinglePost, likePost, sharePost, pinPost, deletePost, displayRecommendedTagsList, getPost }