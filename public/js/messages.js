import {docReady, timeDifference, spinnerV2} from "./common.js";
import {NavigationStack} from "./navigationStack.js";
import {BubbleButton} from "./bubbleButton.js";

document.querySelectorAll(".navigate")[0].addEventListener("click", () => window.location.href = window.location.origin);

const navigationItems = [document.querySelector(".messagesListContainer"), document.querySelector(".newMessageContainer"), document.querySelector(".newGroupChatContainer")];
const routes = [window.location.origin + "/messages", window.location.origin + "/messages/new", window.location.origin + "/messages/new/groups"]

const navigationStack = new NavigationStack(navigationItems, routes, "messages")

new BubbleButton(document.querySelector(".new-message"), "rgba(29, 161, 242, 0.3)")
new BubbleButton(document.querySelector(".goToGroupChat"), "lightgrey", 75)
document.querySelectorAll(".searchFormGroup").forEach(searchInput => {
  new BubbleButton(searchInput, "lightgrey", 100)
})


function objectifyData(data) {
  return Object.fromEntries(
    data.map((u) => [u._id, u])
  );
}

// function createHeadingFromCamelCase(text) {
//   function upperCase(text) {
//     return text.substring(0, 1).toUpperCase() + text.substring(1, text.length);
//   }

//   if(/^[a-z]+$/.test(text)) {
//     return upperCase(text)
//   } else {
//     console.log("We dont reach here")
//     let cut;
//     for(let i = 0; i < text.length; i++) {
//       if(text[i] !== text[i].toLowerCase()) {
//         cut = i;
//         break;
//       }
//     }
    
//     return upperCase(text.slice(0, cut)) + " " + text.slice(cut, text.length).toLowerCase()
//   }
  
// }


function groupChatName(chat) {
  if(chat.customName) return chat.chatName;

  const userLoggedInFn = chat.nicknames[userLoggedIn._id] || userLoggedIn.firstName;
  const splitChatName = chat.chatName.split(", ");

  if(splitChatName.includes(userLoggedInFn)) {
    const indexOfName = splitChatName.indexOf(userLoggedInFn);
    splitChatName.splice(indexOfName, 1);
    return splitChatName.join(", ")
  }

  return chat.chatName;
}

function filterUsers(users, searchTerm) {
  return users.filter((u) => {
    let value = searchTerm.toLowerCase();
    let un = u.username.toLowerCase();
    let fn = u.firstName.toLowerCase();
    let ln = u.lastName.toLowerCase();
    let displayName = fn + " " + ln;

    if(un.startsWith(value) || fn.startsWith(value) || ln.startsWith(value) || displayName.startsWith(value)) {
      return u
    }
  })
}

const messagesListContainer = document.querySelector(".messagesListContainer");

const messagesListClosure = (function messagesList(container) {
  const state = {
    chats: [],
    fetch: true
  }

  const chatListContainer = container.querySelector(".messagesList");
  const searchResultsContainer = chatListContainer.nextElementSibling;
  const searchInput = container.querySelector("input");

  function getState() {
    return state.chats;
  }

  function setState(newState) {
    state.chats = newState;
  }

  function createChatImages(users) {
    
    let html = "<div class='chatImages'>"
    for(let user of users.slice(0, 2)) {
      html += `<img class="chatImage profileImage" src="${user.profilePic}"/>`
    }
    html += "</div>";

    return html;
  }

  function createLatestMessage(chat, userLoggedInId) {
    let {text: messageText, messageType, media} = chat.latestMessage;
    const isYou = chat.updatedBy._id == userLoggedInId
    const sentByUsername = chat.nicknames[chat.updatedBy._id] || chat.updatedBy.firstName;
    console.log("i be runnin")
    if(messageType === "info" || messageType === "delete") {

      if(isYou) {
        if(messageText.includes("nickname")) {
          messageText = `You set your nickname to ${sentByUsername}`
          return `<span class="text">${messageText}</span>`
        }

        messageText = messageText.replace(sentByUsername, "You")
        return `<span class="text">${messageText}</span>`
      } else {
        return `<span class="text">${messageText}</span>`
      }
    }

    if(media.length) {
      if(isYou) {
        messageText = messageText.replace(sentByUsername, "You")
      } 
      return `<span class="text">${messageText}</span>`
    }
    
    let sentByFlag = isYou ? "You: " : `${sentByUsername}: `
    return `<span class="text">${sentByFlag} ${messageText}</span>`
  }

  function messagePreviewDate(lastMessageDate) {
    const now = moment()
    const seconds = now.diff(lastMessageDate, "seconds")
    const minutes = now.diff(lastMessageDate, "minutes")
    const hours = now.diff(lastMessageDate, "hours")
    const days = now.diff(lastMessageDate, "days")
    const weeks = now.diff(lastMessageDate, "weeks")
    const customMessages = {
      seconds: `${seconds} s`,
      minutes: `${minutes} min`,
      hours: `${hours} h`,
      days: `${days} d`,
      moreThanWeek: `${weeks} week${weeks > 1 ? "s" : ""} ago` 
    }

    return timeDifference(new Date(), lastMessageDate, customMessages)
  }

  function chatTemplate(c) {
    // the icon needs to chat dawg
    const senderIsUserLoggedIn = userLoggedIn._id === c.latestMessage.sentBy;
    const seenByYou = c.latestMessage.seen.some(seenObj => seenObj.user === userLoggedIn._id);
    const otherUsers = c.users.filter(u => u._id !== userLoggedIn._id);
    const date = messagePreviewDate(new Date(c.updatedAt));


    let chatName, chatImage, latestMessage, sender = "", messageStatus = "";
    if(c.isGroupChat) {
      chatName = groupChatName(c)
      chatImage = c.chatImage ? `<img src="${c.chatImage}" alt="group chat photo" class="chatImage" />`: createChatImages(otherUsers);
      latestMessage = createLatestMessage(c, userLoggedIn._id);

      if(!c.latestMessage.media.length && !c.latestMessage.messageType === "info") {
        sender = c.updatedBy._id === userLoggedIn._id ? "You:&nbsp;" : `${c.updatedBy.firstName}: `;
      }
    } else {
      chatName = c.chatName ?? `${otherUsers[0].firstName} ${otherUsers[0].lastName}`;
      chatImage = `<img class="chatImage profileImage" src="${otherUsers.length && c._id !== userLoggedIn._id ? otherUsers[0].profilePic : userLoggedIn.profilePic}"/>`
      latestMessage = createLatestMessage(c, userLoggedIn._id);
      if(!c.latestMessage.media.length && !c.latestMessage.messageType === "info") {
        sender = c.updatedBy._id === userLoggedIn._id ? "You:&nbsp;" : "";
      }
    }

    if(c.latestMessage.sentBy === userLoggedIn._id) {
      const seenUsers = c.latestMessage.seen.filter(seenObj => seenObj.user._id !== userLoggedIn._id);
      if(seenUsers.length) {
        messageStatus = `<i class="fa-solid fa-circle-check"></i>`
      } else {
        messageStatus = `<div class="notSeenIcon"></div>`
      }
    }

    return `<a class="messagePreview ${(!seenByYou && !senderIsUserLoggedIn) && "notSeen"}" href="/messages/t/${c._id}" id="${c._id}">
              ${chatImage}
              <div class="chatDetails">
                <p class="chatName">${chatName}</p>
                <p class="latestMessagePreview muted">${sender}${latestMessage}&nbsp;·&nbsp;${date}</p>
              </div>
              <div class="seen">
                ${messageStatus}
              </div>
            </a>`
  }

  function createMessagePreviewHTML(container, chats) {
    let html = "";
    console.log(chats)
    chats.forEach(c => {
      html += chatTemplate(c)
    })

    container.insertAdjacentHTML("beforeend", html);
  }

  async function getUserChats() {
    if(state.fetch) {
      spinnerV2(chatListContainer)
      try {
        const {data: chats} = await axios.get("/api/chats/" + userLoggedIn._id);
        

        if(chats.length) {
          const chatsMap = chats.map(chat => {

            socket.emit("userJoinedChatRoom", {room: chat})

            if(!chat.isGroupChat) {
              let selectedUser = chat.users[0]._id === chat.users[1]._id 
              ? chat.users[0] 
              : chat.users.find(u => u._id !== userLoggedIn._id);

              const chatName = selectedUser.firstName + " " + selectedUser.lastName;
              chat.chatName = chatName.trim();
              chat._id = selectedUser._id;
            }

            return chat;
          })
          
          state.chats = chatsMap;
          createMessagePreviewHTML(chatListContainer, chats)
        }
      } catch(error) {
        console.log(error);
      } finally {
        chatListContainer.querySelector(".messages-loading-spinner").remove();
        state.fetch = false;
      }
    }
  }

  function filterByChatName(arr, value) {
    const re = new RegExp("\[, ]+")
    return arr.filter(c => {
      let chatName = c.chatName.toLowerCase();
      if(chatName.startsWith(value)) {
        return c;
      }

      
      const splitChatName = c.isGroupChat ? chatName.split(re) : chatName.split(" ");
      let valueKeys = {};
      let splitValue = c.isGroupChat ? value.split(re) : value.split(" ");
      console.log(splitValue, splitChatName)
      for(let word of splitValue) {
        valueKeys[word] = word;
      }
      
      for(let word of splitChatName) {
        if(word === valueKeys[word] || word.startsWith(value)) {
          return c;
        }
      }
      
    })
  }

  function showSearchResults(value) {
    if(value.length > 0) {
      const filteredChats = filterByChatName(state.chats, value);
      console.log(filteredChats)
      if(filteredChats.length) {
        searchResultsContainer.classList.add("active")
        searchResultsContainer.innerHTML = "";
        createMessagePreviewHTML(searchResultsContainer, filteredChats)
      } else {
        searchResultsContainer.innerHTML = "";
        searchResultsContainer.classList.remove("active")
      }
    } else if(!value.length) {
      searchResultsContainer.classList.remove("active")
    }
  }

  // searchInput.addEventListener("blur", () => {
  //   setTimeout(() => {
  //     searchResultsContainer.innerHTML = "";
  //     searchResultsContainer.classList.remove("active")
  //   }, 200)
  // })

  searchInput.addEventListener("focus", (e) => showSearchResults(e.target.value.toLowerCase().trim())
)

  let timer;
  searchInput.addEventListener("keyup", e => {
    clearTimeout(timer);
    const value = e.target.value.toLowerCase().trim();
    
    timer = setTimeout(() => {
      showSearchResults(value);
    }, 200)
  })

  return { getUserChats, createLatestMessage, messagePreviewDate, getState, setState, chatTemplate };
})(messagesListContainer)


const groupChatSelectionContainer = document.querySelector(".groupChatSelectionContainer");
const createChatButton = document.querySelector(".createGroup");

const groupChatClosure = (function groupChat(container) {
  let timer;

  const state = {
    users: {},
    usersArrayFormat: [],
    selectedUsers: {},
    fetch: true
  }

  const { selectedUsers } = state;

  const form = document.querySelector("form.newGroupChatContainer");
  const parent = container.parentElement;
  const searchInput = document.getElementById("searchGroupChatUsers");
  const searchResultsContainer = container.nextElementSibling;
  

  async function getUsers() {
    if(state.fetch) {
      try {
        spinnerV2(container)
        const responses = await Promise.all([
          axios.get("/api/users/friends"),
          axios.get("/api/users/fans"),
          axios.get("/api/users/youFollow"),
          axios.get("/api/users/suggestions")
        ])

        const userTypes = ["Friends", "Fans", "You Follow", "Suggestions"]
        // promises may not complete in order in the background
        // promise 4 may be the quickest but in the frontend, promise order will be restored just like the original array
        responses.forEach((resp, i) => {
          if(resp.data.length > 0) {
            createUserCheckBoxes(container, resp.data, userTypes[i])
            state.users = {...state.users, ...objectifyData(resp.data)}
            state.usersArrayFormat = [...state.usersArrayFormat, ...resp.data];
          }
        })
      } catch(error) {
        console.log(error);
      } finally {
        container.querySelector(".messages-loading-spinner").remove();
        state.fetch = false;
      }
                   
      
    } 
  }

  


  function createUserCheckBoxes(container, users, heading = null) {
    let html = heading ? `<h3>${heading}</h3>` : "";

    users.forEach(u => {
      html += `<div class="userCheckBox" data-user-id="${u._id}">
                  <img src="${u.profilePic}" alt="${u.firstName} ${u.lastName}" class="profileImage" />
                  <div class="doe">
                    <span>${u.firstName}</span>
                    <span>${u.lastName}</span>
                    <p class="muted">@<span>${u.username}</span></p>
                  </div>
                  <input type="checkbox" class="checkbox" ${u?.selected && "checked" || ""} />
              </div>`
    })
  
    container.insertAdjacentHTML("beforeend", html);
  }

  function selectUser(e) {
    if(e.target.classList.contains("userCheckBox")) {
      const userId = e.target.dataset.userId;
      const checkBox = e.target.querySelector("input[type='checkbox']");
      console.log(userId, checkBox.checked)
      
      checkBox.checked = !checkBox.checked ? true : false;
      if(checkBox.checked) {
        state.users[userId].selected = true;
        selectedUsers[userId] = state.users[userId]

        
      } else {
        state.users[userId].selected = false;
        delete selectedUsers[userId]
      }

      createChatButton.disabled = Object.keys(selectedUsers).length <= 1;

      if(e.target.parentElement === searchResultsContainer) {
        const checkBox = container.querySelector(`.userCheckBox[data-user-id="${userId}"]`).querySelector("input[type='checkbox']");
        checkBox.checked = state.users[userId].selected;
        searchResultsContainer.classList.remove("active");
      }
    }
  }
  
  searchInput.addEventListener("keyup", e => {
    clearTimeout(timer);
    
    if(e.target.value.trim() !== "") {
      timer = setTimeout(() => {
        searchResultsContainer.classList.add("active")
        const filteredUsers = filterUsers(state.usersArrayFormat, e.target.value);
        console.log(filteredUsers)
        searchResultsContainer.innerHTML = "";
        createUserCheckBoxes(searchResultsContainer, filteredUsers)     
      }, 500)
    } else {
      searchResultsContainer.classList.remove("active")
    }
  })

  searchInput.addEventListener("focus", e => {
    if(e.target.value.trim() !== "") {
      searchResultsContainer.classList.add("active")
    }
  })

  parent.addEventListener("click", selectUser);

  form.querySelectorAll("input[type='text']").forEach(textInput => {
    textInput.addEventListener("keydown", e => {
      if(e.code === "Enter") {
        e.preventDefault();
        console.log("enter")
      }
    })
  })

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);
    
    // add first and foremost yourself
    let users = [{_id: userLoggedIn._id, firstName: userLoggedIn.firstName, lastName: userLoggedIn.lastName}];
    for(let userId in selectedUsers) {
      const {_id, firstName, lastName} = selectedUsers[userId];
      users.push({_id, firstName, lastName});
    }

    formProps.users = users;

    try {
      const chat = await axios.post("/api/chats/new", formProps);

      window.location.href = "/messages/t/" + chat.data.chatId;
    } catch(error) {
      console.log(error);
    }
  })

  return {getUsers}
})(groupChatSelectionContainer)


const newMessageContainer = document.querySelector(".newMessageContainer");

const newMessageClosure = (function newMessage(container) {
  const state = {
    chats: [],
    fetch: {
      suggested: true,
      chats: true
    }
  }

  const resultsContainer = container.querySelector(".results");
  const searchResultsContainer = container.querySelector(".searchResults");
  const form = container.querySelector("#newMessageSearchForm");
  const searchInput = form.querySelector("#searchChatInput");

  async function getUsers(searchTerms, iteration = 0, users = []) {
    const response = await axios.get(`/api/users/${searchTerms[iteration]}`);
    users = !users.length ? response.data : users.concat(response.data);

    if(iteration === searchTerms.length) return users;
    console.log(users, searchTerms[iteration]);

    if((!users.length || users.length < 10) && iteration < searchTerms.length - 1) {
      iteration++;
      return getUsers(searchTerms, iteration, users);
    }

    return users;
  }

  function createChatTab(chat, appendTo) {
    const chatContainer = document.createElement("a");
    chatContainer.setAttribute("href", `/messages/t/${chat._id}`)
    chatContainer.classList.add("chat");
    let image;
    if(chat.isGroupChat) {
      image = `<div class="chatImages">
                  ${chat.users.slice(0, 2).map(user => (`<img class="chatImage" src="${user.profilePic}" alt="${user.firstName}" />`)).join("")}
               </div>`
    } else {
      image = `<img class="profileImage" src="${chat.image}" alt="${chat.chatName}" />`;
    }

    chatContainer.innerHTML = `${image}<div class="chatName">${chat.chatName}</div>`

    appendTo.append(chatContainer);
  }

  function convertUsersToChatObjects(users) {
    return users.map(user => ({_id: user._id, chatPicture: user.profilePic, chatName: user.firstName + " " + user.lastName, image: user.profilePic, isGroupChat: false}))
  }

  function convertDuetChatsToObjects(duetChats) {
    return duetChats.map(chat => {
        const otherUser = chat.users.find(u => u._id !== userLoggedIn._id);
        return {_id: otherUser._id, chatPicture: otherUser.profilePic, chatName: otherUser.firstName + " " + otherUser.lastName, image: otherUser.profilePic, isGroupChat: false}
    })
  }

  function createSuggestions(suggestions) {
    const header = document.createElement("small");
    header.classList.add("subheader")
    header.classList.add("muted");
    header.textContent = "Suggested";

    for(let suggestedChat of suggestions) {
      createChatTab(suggestedChat, resultsContainer);
    }

    resultsContainer.prepend(header);
  }

  async function getRecommendedChats() {
    if(state.fetch.suggested) {
      try { 
        spinnerV2(resultsContainer)
        const suggestions = await getUsers(["friends", "youFollow", "fans"])
        if(suggestions.length) {
          state.chats = [...state.chats, ...convertUsersToChatObjects(suggestions)]
          createSuggestions(state.chats)
        }
      } catch(error) {
        console.log(error);
      } finally {
        resultsContainer.querySelector(".messages-loading-spinner").remove();
        state.fetch.suggested = false;
      }
    }
  }

  function removeDuplicates(arr, ids) {
    const idsCount = Object.keys(ids).length;
    let itemsFound = 0;
    const cleanArray = [];
    for(let item of arr) {
      if(itemsFound == idsCount) break;

      const {_id: id } = item;
      let searchedItemIdExists = ids[id] || null

      if(id !== searchedItemIdExists) {
        cleanArray.push(item);
        itemsFound++;
      }
    }

    return cleanArray;
  }

  function createChatTabs(array, container) {
    container.innerHTML = "";
    for(let item of array) {
      createChatTab(item, container)
    }
  }

  let keypressTimer;
  searchInput.addEventListener("keyup", e => {
    clearTimeout(keypressTimer);
    keypressTimer = setTimeout(async () => {
      searchResultsContainer.innerHTML = "";
      searchResultsContainer.classList.add("show");
      const searchTerm = e.target.value.trim();
      spinnerV2(searchResultsContainer)
      if(state.fetch.chats) { 
        const { data: chats } = await axios.get("/api/chats/" + userLoggedIn._id);
        const chatTypes = chats.reduce((acc, chat) => {
          let type = chat.isGroupChat ? "group" : "duet";
          let chatIdList = chat.isGroupChat ? "groupIds" : "duetIds";
          let chatId = chat._id;
          if(!chat.isGroupChat) {
            // saving the chatId as the other users id
            // since the suggested users that we've already fetched have a chatId set to their own user id
            // in later stages, we would not be able to compare for duplicate users since the duet chat ids are just chats and have their own id
            // we'll also need to search for more users in this search input
            // in case no chats have been found in our current chat state
            let otherUser = chat.users.find(u => u._id !== userLoggedIn._id);
            chatId = otherUser._id;
          }

          if(chat.isGroupChat) {
            chat.chatName = groupChatName(chat)
          }

          return {...acc, [type]: [...acc[type], {...chat, _id: chatId}], [chatIdList]: {...acc[chatIdList], [chatId]: chatId}}
        }, {
          group: [],
          duet: [],
          duetIds: {},
          groupIds: {}
        })
        
        // duplicates can only be duet chat;
        // state.chats at this point only has suggested users
        const cleanDuplicateDuetChats = removeDuplicates(state.chats, chatTypes.duetIds);
        const duetChats = convertDuetChatsToObjects(chatTypes.duet);
        state.chats = [...cleanDuplicateDuetChats, ...chatTypes.group, ...duetChats];
        state.fetch.chats = false;
      }
      
      // allright, searching for chat or user that we wanna chat
      // we first check our chat state, which contains suggested users and all our chats
      // if our search doesn't match anything we query the backend for a user that satisfies our search

      if(searchTerm.length) {
        let filteredChats = state.chats.filter(chat => {
          if(chat.chatName.toLowerCase().includes(searchTerm.toLowerCase())) {
            return chat;
          }
        })
  
        if(filteredChats.length) {
          createChatTabs(filteredChats, searchResultsContainer)
        } else {
          const getUsers = await axios.get("/search/users", {params: {searchInput: searchTerm, excludedField: "username", excludedUsers: [userLoggedIn._id] }})
          const userChatObjects = convertUsersToChatObjects(getUsers.data);

          createChatTabs(userChatObjects, searchResultsContainer)
        }
      } else {
        searchResultsContainer.innerHTML = "";
        searchResultsContainer.classList.remove("show");
      }
      
    }, 500)

  })

  form.addEventListener("submit", e => {
    e.preventDefault();
  })

  return { getRecommendedChats }
})(newMessageContainer.querySelector(".container"))


async function historyState(route) {
  switch (route) {
    case "groups": 
      return await groupChatClosure.getUsers();
    case "new":
      return newMessageClosure.getRecommendedChats();
    default:
      return await messagesListClosure.getUserChats();
  }
}

function updateChatList(chat) {
  const chatList = messagesListClosure.getState();
  const chatId = setChatId(chat);
  chat = {...chat, _id: chatId}
  const chatExists = chatList.find(c => c._id === chatId)

  if(chatExists) {
    if(new Date(chatList[0].latestMessage.updatedAt) < new Date(chat.latestMessage.updatedAt)) {
      // you should check if an item with that id even exists first, it exists tho
      const indexOFChat = chatList.findIndex(c => c._id === chatId);
      chatList.splice(indexOFChat, 1);
      messagesListClosure.setState([chat, ...chatList])
  
      document.getElementById(chatId).remove();
      const updatedChat = messagesListClosure.chatTemplate(chat);
      document.querySelector(".messagesList").insertAdjacentHTML("afterbegin", updatedChat)
    }
  } else {
    messagesListClosure.setState([chat, ...chatList]);
    socket.emit("userJoinedChatRoom", {room: chat })

    const newChat = messagesListClosure.chatTemplate(chat);
    document.querySelector(".messagesList").insertAdjacentHTML("afterbegin", newChat)
  }
  
}

function setChatId(chat) {
  if(!chat.isGroupChat) {
    return chat.users[chat.users.findIndex(u => u._id !== userLoggedIn._id)]._id;
  }

  return chat._id;
}

docReady(() => {

  socket.on("userIsTyping", chatDetails => {
    const chatId = setChatId(chatDetails.chat);
    const previewEl = document.getElementById(chatId);
    const textEl = previewEl.querySelector(".latestMessagePreview");

    textEl.textContent = `${chatDetails.user} is typing...`
  })

  socket.on("messageReceived", chatDetails => {
    updateChatList(chatDetails.chat)
  }) 

  socket.on("userStoppedTyping", chatDetails => {
    const {chat, senderId } = chatDetails;
    // So when a user stops typing, either a new message was sent or nothing
    // check if its a new one
    // if its not, do the thing you were doing
    // if it is, update the state
    // delete the element, insert it before firstChild

    // user stopped typing will be sent only 
    const chatList = messagesListClosure.getState();
    const chatId = setChatId(chat);
    console.log(chatId, document.getElementById(chatId))
    if(new Date(chatList[0].latestMessage.updatedAt) < new Date(chat.latestMessage.updatedAt)) {
      // you should check if an item with that id even exists first, it exists tho
      const indexOFChat = chatList.findIndex(c => c._id === chatId);
      chatList.splice(indexOFChat, 1);
      messagesListClosure.setState([chatDetails.chat, ...chatList])

      document.getElementById(chatId).remove();
      const updatedChat = messagesListClosure.chatTemplate(chat);
      document.querySelector(".messagesList").insertAdjacentHTML("afterbegin", updatedChat)
    } else {
      const latestMessageText = document.getElementById(chatId).querySelector(".latestMessagePreview");
    
      latestMessageText.innerHTML = `${messagesListClosure.createLatestMessage(chat, userLoggedIn._id)}
                                   &nbsp;·&nbsp;
                                   ${messagesListClosure.messagePreviewDate(new Date(chat.updatedAt))}`
    }

    
  })


  const splitPath = window.location.pathname.split("/").filter(loc => loc !== "");
  const route = splitPath.pop();
  historyState(route)
})

window.addEventListener('popstate', (e) => {
  historyState(window.history.state.route)
})