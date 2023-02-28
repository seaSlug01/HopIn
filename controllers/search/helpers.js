const User = require("../../schemas/UserSchema");


function createPayload(userLoggedIn) {
  return {
    pageTitle: `Search`,
    userLoggedIn: userLoggedIn,
    userLoggedInJs: JSON.stringify(userLoggedIn)
  }
}

function incrementTimesFound(results, doc) {
  const docFound = results[doc._id];
  let timesFound = 0;
  if(docFound) {
    timesFound = docFound.timesMatched; 
  }
  return timesFound;
}

function historyItem(req) {
  const searchHistory = req.session.user.searchHistory
  const {id, type} = req.body;
  let doc = {
    exists: false,
    index: 0
  };

  if(searchHistory !== undefined && searchHistory.length) {
    for(let i = 0; i <= searchHistory.length - 1; i++) {
      if(!searchHistory[i].type === type) continue;

      if(searchHistory[i].id === id) {
        doc = {
          exists: true,
          views: searchHistory[i].views,
          date: searchHistory[i].createdAt,
          index: i,
          additionalData: searchHistory[i].additionalData
        };
        break;
      }  
    }
  }

  return doc;
}

async function pushOrSet(req, doc) {
  let {id, type, ...restProps} = req.body;
  id = id.trim();
  let user;

  if(doc.exists) {
    console.log("UPDATING")
    user = await User.findByIdAndUpdate(req.session.user._id, {$set: {[`searchHistory.${doc.index}`]: { id, searchType: type, views: doc.views + 1, createdAt: doc.date, additionalData: {...doc.additionalData}}}}, {new: true, upsert: true}) 
  } else {
    console.log("ADDING")
    user = await User.findByIdAndUpdate(req.session.user._id, {$push: {searchHistory: { id, searchType: type, views: 1, additionalData: {...restProps} }}}, {new: true})
  }

  return user;
}

module.exports = {pushOrSet, historyItem, incrementTimesFound, createPayload}