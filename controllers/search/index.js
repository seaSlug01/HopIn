const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");
const { pushOrSet, historyItem, incrementTimesFound, createPayload } = require("./helpers");

const addToHistory = async (req, res) => {
  const doc = historyItem(req);
  
  const user = await pushOrSet(req, doc)

  req.session.user = user
  // returning might not be needed since we're changing page when we click?
  return res.send({ searchHistory: user.searchHistory })  
}

const deleteHistory = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.session.user._id, {
      $unset: { searchHistory: [] }
    }, {new: true})

    req.session.user = user;
    return res.status(204).send({userLoggedIn: user, message: "All of your history items have been deleted."})
  } catch(error) {
    console.log(error)
  }
}

const deleteHistoryItem = async (req, res) => {
  const id = req.params.id;
  let user;

  user = await User.findByIdAndUpdate(req.session.user._id, {
    $pull: {searchHistory: {id}}
  }, {new: true})

  console.log("When id null we still be here")
  req.session.user = user;
  res.status(204).send({userLoggedIn: user})
}

const usersWindow = async (req, res) => {
  const searchInput = req.query.searchInput;
  const excludedField = req.query.excludedField || null;
  const excludedIds = req.query.excludedIds || null;
  const limit = +req.query.limit || 8;
  
  const query = {
    $or: [
      {firstName: { $regex: searchInput.split(" ")[0], $options: "i"}},
      {lastName: { $regex: searchInput, $options: "i"}},
      {username: { $regex: searchInput, $options: "i"}}
    ]
  }

  if(excludedField) {
    const findMethods = ["firstName", "lastName", "username"];
    const indexToRemove = findMethods.indexOf(excludedField);

    query.$or.splice(indexToRemove, 1);
  }

  if(excludedIds) {
    query._id = {$nin: excludedIds}
  }

  const users = await User.find(query).limit(limit);
  res.send(users);
}


// SEARCHING

const search = async (req, res) => {
  const searchQuery = req.query.search

  if(searchQuery) {
    let results = {}
    let posts = []
    let people = []
    const words = searchQuery.split(" ").filter(word => word !== "");

    for(let word of words) {
      
      const usersData = await User.find({
        $or: [
          {firstName: { $regex: word, $options: "i"}},
          {lastName: { $regex: word, $options: "i"}},
          {username: { $regex: word, $options: "i"}}
        ]
      })

      for(let user of usersData) {
        const timesMatched = incrementTimesFound(results, user);
        results[user._doc._id] = { ...user._doc, timesMatched: 1 + timesMatched};
      }

      const postsData = await Post.find({content: {$regex: word, $options: "i"}})
        .populate({ path: 'postedBy', select: "firstName lastName username profilePic followers following bio location" })
        .populate("shareData")
        .populate({path: "replyTo", populate: {path: "postedBy", select: "firstName lastName username profilePic followers following bio location"}})
        .catch(error => console.log(error));

      for(let post of postsData) {
        const timesMatched = incrementTimesFound(results, post);
        results[post._doc._id] = {...post._doc, isPost: true, timesMatched: 1 + timesMatched };
      }
    }

    // get top results, means the search term has both the user and the post that the user posted
    // another criterion could be if the searchTerm has more than 1 word matching with the post
    // tho that can be handled in the front
    // but how?
    let topResults = []
    for(let key in results) {
      if(results[key].isPost) {
        const userThatPosted = results[key].postedBy._id;
        if(results[userThatPosted]) {
          topResults.push(results[key]);
        } else {
          posts.push(results[key])
        }
      } else {
        people.push(results[key])
      }
       
    }

    
    res.status(200).send({posts, people, topResults});
  }
}

const renderSearchPage = async (req, res) => {
  var payload = createPayload(req.session.user);
  res.status(200).render("searchPage", payload); 
}

const historyView = async (req, res) => {
  res.status(200).send({ searchHistory: req.session.user.searchHistory })
}



module.exports = { addToHistory, search, usersWindow, renderSearchPage, historyView, deleteHistoryItem, deleteHistory }