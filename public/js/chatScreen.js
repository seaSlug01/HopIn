import {EmojiSelection} from "./emoji.js";
import {uploadMultipleTemplate, UploadFiles } from "./UploadDropzone.js";
import {formatBytes, docReady, scrollToBottom, setMessageTooltipPosition, timeDifference, elements, downloadLink, deleteUserTempFiles} from "./common.js";
import {openModal, closingModalInitialState} from "./modal.js";
import {Accordion} from "./accordion.js";
import {BubbleButton} from "./bubbleButton.js";
import {Gallery} from "./gallery.js";


let userIsTyping = false;
let lastTypingTime;

// to problem einai pws kathe fora pou stelneis mhnyma den diagrafete to palio seen flag
// and why would it?
// epeidh stelneis man
// ypotithetai pws diavases to allo




const messageTextarea = document.getElementById("textMessage");
const emojiToggleBtn = document.querySelector(".emojiToggle");
const submitBtn = document.querySelector(".sendMessage");
const mediaBtn = document.querySelector(".media");
const previewsContainer = document.querySelector(".dropzone-message-previewContainer");
const messageForm = document.getElementById("submitMessage");
const chatViewContainer = document.getElementById("chatContainer");
const chatMessagesContainer = document.querySelector(".chatMessagesContainer");
const modalReactionsList = document.querySelector(".body__reactionsList");
const replyingTo = document.querySelector(".replyingTo");
const chatInformationContainer = document.getElementById("chatInformation");
const navigateBackButton = document.querySelector(".navigate[aria-label='Back']");
const searchConvoForm = document.querySelector(".searchInConvo");
const userTyping = document.querySelector(".userTyping");
const scrollBottom = document.getElementById("scrollBottom");


function goBack() {
  window.location.href = "/messages";
}
navigateBackButton.addEventListener("click", goBack)

const chatState = {
  chat: chatDB,
  messages: messagesDB.reverse(),
  searchedMessages: [],
  searchKeywords: "",
  media: [],
  files: [],
  mainReactionEmoji: {},
  usersViewing: [],
  replyingTo: {},
  fetchMoreMessages: {
    top: false,
    bottom: false
  },
  loading: false,
  newMessage: false
}



async function updateChat(condition) {
  if(chatState.chat !== null) {
    if (condition) {
      try {
        chatState.loading = true;
        //report that user is in focus
        const {data: {updatedMessage}} = await axios.put(`/api/chats/updateSeenFlag`, {chat: chatState.chat});
        if(updatedMessage.seen.length !== chatState.chat.latestMessage.seen.length) {
          chatState.chat.latestMessage = updatedMessage;
          chatState.messages[chatState.messages.length - 1] = updatedMessage;
          socket.emit("userJoinedChatRoom", {room: chatState.chat, userId: userLoggedIn._id})
          
          const latestMessageMessageStatusEl = document.getElementById(chatState.chat.latestMessage._id).querySelector(".messageStatus");
          latestMessageMessageStatusEl.innerHTML = "";
      
          addMessageStatus(chatState.chat.latestMessage, false, latestMessageMessageStatusEl);
          getPreviousSeenFlags(chatState.chat.latestMessage.seen.map(so => so.user._id), animateSeenFlags)

          chatMessagesContainer.scrollTo(0, chatMessagesContainer.scrollHeight)
        } 
      } catch(error) {
        console.log(error)
      } finally {
        chatState.loading = false;
      }
      
      
    
    } else {
    //report that user is out of focus
    socket.emit("userExitedChatRoom", {room: chatState.chat._id, userId: userLoggedIn._id})
    } 
  } 
}

document.addEventListener('visibilitychange', async () => await updateChat(document.visibilityState === 'visible' && !chatState.loading));

messageTextarea.addEventListener("focus", async () => await updateChat(!chatState.loading))

window.addEventListener("beforeunload", async () => {
  if(chatState.chat !== null) {
    const fn = {userId: userLoggedIn._id, chatId: chatState.chat._id}
    window.localStorage.setItem("userExitedChatRoom", JSON.stringify(fn))
  }
})




docReady(async () => {
  console.log(chatState.usersViewing)

  if(chatState.chat !== null) {
    // Socket related stuff inside this block
    // Whatever is emited using the chat id, remember that chat may not exist, so use ?. operator to avoid problems
    // or make an if condition before emiting => if(chat) { ... }
    socket.emit("userJoinedChatRoom", {room: chatState.chat, userId: userLoggedIn._id})

    socket.on("userJoinedChatRoom", ({room, userId}) => {
      console.log("USER JOINED CHATROOM", userId)
      if(userId) {
        const indexOfUser = chatState.usersViewing.indexOf(userId);
        if(indexOfUser > -1) return;
        chatState.usersViewing = [...chatState.usersViewing, userId]
        console.log("users in chat ", chatState.usersViewing)
      }

      if(chatState.chat.latestMessage.seen.length !== room.latestMessage.seen.length) {
        console.log(room.latestMessage.seen.map(so => so.user._id ))
        chatState.chat.latestMessage = room.latestMessage;
        chatState.messages[chatState.messages.length - 1] = room.latestMessage;
        
        const latestMessageMessageStatusEl = document.getElementById(chatState.chat.latestMessage._id).querySelector(".messageStatus");
        const copiedLatestMessage = {...chatState.chat.latestMessage, seen: chatState.chat.latestMessage.seen.filter(seenObj => seenObj.user._id === userId)}
        // cuz i'll just just append the user that just joined to the messageStatus (addMessageStatus adds each user contained in the seen array of the target message)
        // I copy that message and modify the seen array to contain only the user that just joined
        addMessageStatus(copiedLatestMessage, false, latestMessageMessageStatusEl);

        getPreviousSeenFlags(chatState.chat.latestMessage.seen.map(so => so.user._id), animateSeenFlags)
      }
      
    })

    socket.on("userExitedChatRoom", (userId) => {
      console.log("A USER HAS JUST EXITED")
      const indexOfUser = chatState.usersViewing.indexOf(userId)
      console.log("USER ID", userId, chatState.usersViewing.indexOf(userId))
      if(indexOfUser !== -1) {
        chatState.usersViewing.splice(indexOfUser, 1);
        console.log("userExitedRoom after ", chatState.usersViewing);
      }
    
    })

    socket.on("messageReceived", (newMessageData) => messageReceived(newMessageData))

    socket.on("userIsTyping", () => {
      console.log("User is typing")
      userTyping.classList.remove("d-none");
    })

    socket.on("userStoppedTyping", () => {
      console.log("User stoped typing")
      userTyping.classList.add("d-none")
    })
  }


  const emojiPromises = [axios.get("/api/emojis/get/heart"), axios.get("/api/emojis/get/laughing"), axios.get("/api/emojis/get/open_mouth"),  axios.get("/api/emojis/get/cry"), axios.get("/api/emojis/get/angry"), axios.get("/api/emojis/get/thumbsup")];

  await Promise.all(emojiPromises).then(responses => {
    responses.forEach(({data, config}) => {
      const name = config.url.split("/").pop();
      chatState.mainReactionEmoji[data] = name;
    }) 
  })

  console.log(chatState.chat)
  console.log(chatState.usersViewing, userLoggedIn._id )
  appendConvoInformationButtonToPageHeader();
  if(chatState.messages.length < 5) {
    await createChatHeader(chatState.chat, chatMessagesContainer);
  }

  
  constructMessages(chatState.messages)
  console.log(chatState.messages)
  setTimeout(() => {
    chatState.fetchMoreMessages.top = true;
    chatState.fetchMoreMessages.bottom = true;
  }, 100)
  if(chatState.messages) {
    chatMessagesContainer.querySelector(".messageContainer:not(.info)")?.classList.add("mt-auto");
  }
  scrollToBottom(chatMessagesContainer);
})


function modifyChatModal() {
  const modal = elements.modifyChatModal;
  const modalChildren = {}
  const state = {};

  async function searchUsersListener(e) {
    
    if(e.target.value.trim().length) {
      const users = await axios.get("/search/users", {params: {searchInput: e.target.value, excludedField: "username", excludedIds: state.excludedIds, limit: 20}})
      
      let usersHTML = users.data.map(u => {
        return `<div class="userCheckbox" data-user-id="${u._id}">
          <img src="${u.profilePic}" alt="user picture" class="profileImage" />
          <p class="name">${u.firstName} ${u.lastName}</p>
          <input type="checkbox" class="checkbox" ${state.usersSelected[u._id] && "checked"} />
        </div>`
      }).join("")

      modalChildren.searchedUsers.innerHTML = "";
      modalChildren.searchedUsers.insertAdjacentHTML("beforeend", usersHTML);
    } else {
      modalChildren.searchedUsers.innerHTML = "";
    }
    
  }


  function selectedUserTemplate(userId, username, imageSRC) {
    const template = `<div class="selectedUserPreview" data-user-id="${userId}">
                        <div class="imageContainer">
                        <button><i class="fa-solid fa-xmark"></i></button>
                          <img src="${imageSRC}" alt="user image" class="profileImage" />
                        </div>
                        <p class="muted">${username.length > 16 ? username.slice(0, 16) + "..." : username}</p>
                      </div>`
    
    modalChildren.selectedUsersPreview.insertAdjacentHTML("beforeend", template);
  }

  function wayToRemove(container) {
    if(Object.keys(state.usersSelected).length) {
      animateRemoveSelectedUser(container);
    } else {
      container.remove();
      noUserSelectedText();
      modalChildren.submitBtn.disabled = true;
    } 
  }

  function noUserSelectedText() {
    const p = document.createElement("p");
    p.classList.add("noUsersSelected");
    p.classList.add("muted");
    p.textContent = "No users selected";
    modalChildren.selectedUsersPreview.appendChild(p);
    modalChildren.selectedUsersPreview.classList.add("selectedUsersPreview--empty");
  }

  function selectUsers(e) {
    if(e.target.classList.contains("userCheckbox")) {
      const checkbox = e.target.querySelector(".checkbox");
      const userId = e.target.dataset.userId;

      if(checkbox.checked) {
        checkbox.checked = false;
        state.usersSelected[userId] = userId;
        wayToRemove(modalChildren.selectedUsersPreview.querySelector(`.selectedUserPreview[data-user-id="${userId}"]`))
        
      } else {
        modalChildren.selectedUsersPreview.classList.remove("selectedUsersPreview--empty");
        modalChildren.selectedUsersPreview.querySelector(".noUsersSelected")?.remove()
        modalChildren.submitBtn.disabled = false;
        state.usersSelected[userId] = userId
        checkbox.checked = true;
        const imgSRC = e.target.querySelector(".profileImage").src;
        const name = e.target.querySelector(".name").textContent;
        selectedUserTemplate(userId, name, imgSRC)
      }
    }
  }

  function animateRemoveSelectedUser(container) {
    container.innerHTML = "";
    container.classList.add("remove");

    container.addEventListener("transitionend", e => e.target.remove())
  }

  function removeSelectedUser(e) {
    if(e.target.tagName === "BUTTON") {
      const container = e.target.closest(".selectedUserPreview");
      const userId = container.dataset.userId;
      const userCheckbox = modalChildren.searchedUsers.querySelector(`.userCheckbox[data-user-id="${userId}"] .checkbox`);
      delete state.usersSelected[userId]
      
      if(userCheckbox) {
        userCheckbox.checked = false;
      }
      wayToRemove(container) 
    }
  }

  function addMembersTemplate() {
    const searchInputId = crypto.randomUUID();
    const html = `<div class="modal-container center">
      <div class="modal-close round btn-icon"></div>
      <div class="modal-header">
        <h3><strong>Add people</strong></h3>
      </div>
      <div class="modal-body">
        <div class="modal-body__form-group">
          <label for="${searchInputId}"><i class="fa-solid fa-magnifying-glass"></i></label>
          <input type="text" placeholder="Search" name="addPeopleSearch" class="addPeopleSearch" id="${searchInputId}" autocomplete="off" />
        </div>
        <form class="modal-body__form">
          <div class="selectedUsersPreview selectedUsersPreview--empty">
            <p class="noUsersSelected muted">No users selected</p>
          </div>

          <div class="searchedUsers">
          
          </div>

          <button type="submit" class="close-prompt modal-body__form__submit" disabled>Add people</button>
        </form>
      </div>
    </div>`


    modal.insertAdjacentHTML("afterbegin", html);

    // elements
    modalChildren.searchedUsers = modal.querySelector(".searchedUsers")
    modalChildren.selectedUsersPreview = modal.querySelector(".selectedUsersPreview");
    modalChildren.form = modal.querySelector(".modal-body__form");
    modalChildren.submitBtn = modalChildren.form.querySelector(".modal-body__form__submit");
    state.usersSelected = {}
    state.excludedIds = chatState.chat.users.map(u => u._id)

    document.getElementById(searchInputId).addEventListener("keyup", _.throttle(e => searchUsersListener(e), 500));

    // add click listener to searchUsers
    modalChildren.searchedUsers.addEventListener("click", selectUsers)
    // add remove lister to selectedUsersPreview
    
    modalChildren.selectedUsersPreview.addEventListener("click", removeSelectedUser)

    modalChildren.form.addEventListener("submit", async e => {
      e.preventDefault();

      try {
        const response = await axios.put(`/api/chats/addPeople`, {chat: chatState.chat, userIds: Object.keys(state.usersSelected)});
        
        const {generateHTML: appendChatMember} = displayChatMembers();
        const targetAccordion = document.querySelector(".accordion__chatMembers");
        const targetAccordionBody = targetAccordion.querySelector(".accordion__body");
        const userTabHeight = targetAccordionBody.querySelector(".accordion__user").offsetHeight;
        const targetAccordionCurrentHeight = targetAccordion.offsetHeight;

        // add newly added users to the accordion
        response.data.users.forEach(user => {
          targetAccordionBody.insertBefore(appendChatMember(user, chatState.chat), targetAccordionBody.lastChild)
        })

       // Change accordion height
        targetAccordion.style.height = `${targetAccordionCurrentHeight + (userTabHeight * response.data.users.length)}px`;
        
        // update chat users state
        chatState.chat.users = [...chatState.chat.users, ...response.data.users];
        
        // add user pictures if there's not a default one
        if(!chatState.chat.chatImage) {
          if(chatState.chat.users.length < 16) {
            // there are potentially 2 of these, one when the reach to the top of the chat and one in the settings 
            const chatPictureContainers = document.querySelectorAll(".chatPictureContainer");
            chatPictureContainers.forEach(pictureContainer => createSideToSidePictures(pictureContainer, chatState.chat)) 
          }
        }


        // chatname will change if no default one
        if(!chatState.chat.customName) {
          const newChatName = response.data.chatName
          chatState.chat.chatName = newChatName;
          const chatHeaders = document.querySelectorAll(".chatHeader h3");
          chatHeaders.forEach(chatHeader => chatHeader.textContent = newChatName)
          document.querySelector(".pageTitle span").textContent = newChatName;
        }

        // close modal
        document.getElementById("modifyChatModal").innerHTML = "";
        closingModalInitialState(document.getElementById("modifyChatModal"));
      } catch(error) {
        console.log(error);
      }
    })
  }


  return {addMembersTemplate}
}

function displayChatMembers() {
  function generateOptions(user, chat) {
    const currentUserTabIsUserLoggedIn = user._id === userLoggedIn._id;
    const userLoggedInIsChatCreator = chat.createdBy === userLoggedIn._id;

    

    let userRole = "";
    if(currentUserTabIsUserLoggedIn) {
      userRole = "userLoggedIn"
    } else if(userLoggedInIsChatCreator) {
      userRole = "chatCreator";
    } else if(chat.admin.find(id => id === userLoggedIn._id)) {
      userRole = "admin"
    } else {
      userRole = "member"
    }


    // admin cannot remove an admin, except if the user is the chat creator
    const currentUserIsAdmin = chat.admin.find(id => id === user._id);
    const roles = {
      chatCreator: ["profile", "message", chat.admin.find(id => id === user._id) ? "removeAdmin" : "makeAdmin", "remove"],
      admin: currentUserIsAdmin ? ["profile", "message"] : ["profile", "message", "remove"],
      member: ["profile", "message"],
      userLoggedIn: ["profile", "leave"]
    }
  
    const options = {
      makeAdmin: `<button class="accordion__user__optionsContainer__list__list-item make-admin" data-action="makeAdmin"><i class="fa-solid fa-users"></i><span>Make admin</span></button>`,
      removeAdmin: `<button class="accordion__user__optionsContainer__list__list-item remove-admin" data-action="removeAdmin"><i class="fa-solid fa-users"></i><span>Remove admin</span></button>`,
      profile: `<a class="accordion__user__optionsContainer__list__list-item" href="/profile/${user._id}"><i class="fa-regular fa-user"></i>View profile</a>`,
      remove: `<button class="accordion__user__optionsContainer__list__list-item remove-chatUser" data-action="removeChatUser"><i class="fa-solid fa-ban"></i>Remove from chat</button>`,
      leave: `<button class="accordion__user__optionsContainer__list__list-item" data-action="leaveChat"><i class="fa-solid fa-arrow-right-from-bracket"></i>Leave group</button>`,
      message: `<a class="accordion__user__optionsContainer__list__list-item" href="/messages/t/${user._id}"><i class="fa-regular fa-message"></i>Message</a>`,
    }
  
    // DOM start
    const optionsContainer = document.createElement("div");
    optionsContainer.classList.add("accordion__user__optionsContainer")
    optionsContainer.setAttribute("data-user-id", user._id)
    const optionsBtn = document.createElement("button");
    optionsBtn.insertAdjacentHTML("beforeend", `<i class="fa-solid fa-ellipsis"></i>`)
    optionsBtn.classList.add("accordion__user__optionsContainer__optionsBtn");
    const optionsList = document.createElement("div");
    optionsList.classList.add("accordion__user__optionsContainer__list")
  
    for(let option of roles[userRole]) {
      optionsList.insertAdjacentHTML("beforeend", options[option]);
    }
  
    [optionsBtn, optionsList].forEach(el => optionsContainer.appendChild(el))
  
    return optionsContainer;
  }

  function generateHTML(user, chat) {
    const isAdmin = chat.admin.find(id => id === user._id);

    const container = document.createElement("div");
    container.classList.add("accordion__user")
    const profilePic = `<a href="/profile/${user._id}"><img src="${user.profilePic}" alt="user picture" /></a>`
    const userDetails = document.createElement("div");
    userDetails.textContent = chat.nicknames[user._id] || `${user.firstName} ${user.lastName}`;
    if(isAdmin) {
      const subHeader = document.createElement("span");
      subHeader.classList.add("muted");
      const isChatCreator = isAdmin === chat.createdBy;
      subHeader.textContent = isChatCreator ? "Group creator" : "Admin";
      userDetails.appendChild(subHeader);
    }

    userDetails.classList.add("accordion__user__userDetails");
    
    const optionsContainer = generateOptions(user, chat);

    [profilePic, userDetails, optionsContainer].forEach(element => {
      if(typeof element === "string") {
        container.insertAdjacentHTML("beforeend", element) 
      } else {
        container.appendChild(element);
      }
    })
    
    
    return container;
  }

  return {generateHTML};
}

function displayChatMembersToAccordion(target) {
  const {generateHTML} = displayChatMembers();


  function addPeopleButton(container) {
    if(chatState.chat.admin.some(id => id === userLoggedIn._id)) {
      const {addMembersTemplate} = modifyChatModal();
      const addPeople = document.createElement("button");
      addPeople.classList.add("addPeople");
      addPeople.innerHTML = `<div><i class="fa-solid fa-plus"></i></div><span>Add people</span>`
      container.appendChild(addPeople);
      addPeople.addEventListener("click", () => openModal(elements.modifyChatModal, addMembersTemplate()))
    }

  }

  chatState.chat.users.forEach(user => {
    target.el.querySelector(".accordion__body").appendChild(generateHTML(user, chatState.chat))
  })

  addPeopleButton(target.el.querySelector(".accordion__body"));

  const bodyHeight = target.el.querySelector(".accordion__body").offsetHeight;
  const headerHeight = target.el.querySelector(".accordion__header").offsetHeight;
  target.el.style.height = `${headerHeight + bodyHeight}px`;
}

function hideChatDetails() {
  chatInformationContainer.classList.remove("show");
  navigateBackButton.removeEventListener("click", hideChatDetails)
  navigateBackButton.addEventListener("click", goBack)
}

function nicknamesModal() {
  const modalChildren = {};

  function createNicknamesTemplate() {
    const html = `<div class="modal-container center">
      <div class="modal-close round btn-icon"></div>
      <div class="modal-header">
        <h3><strong>Nicknames</strong></h3>
      </div>
      <div class="modal-body">
        <form class="modal-body__nicknames-form">

        </form>
      </div>
    </div>`

    elements.modifyChatModal.insertAdjacentHTML("beforeend", html);
    modalChildren.container = elements.modifyChatModal.querySelector(".modal-container");
    modalChildren.body = modalChildren.container.querySelector(".modal-body");
    modalChildren.form = modalChildren.body.querySelector(".modal-body__nicknames-form");

    createNicknameInput(modalChildren.form);

    modalChildren.form.addEventListener("mouseover", addWhite);
    modalChildren.form.addEventListener("mouseout", addWhite);

    modalChildren.form.addEventListener("submit", async e => {
      e.preventDefault();
      const activeUserEl = e.target.querySelector(".active");
      
      const input = activeUserEl.querySelector("input");
      const userId = activeUserEl.dataset.userId;

      if(input.value === "" && !chatState.chat.nicknames[userId] || input.value === chatState.chat.nicknames[userId]) return activeUserEl.classList.remove("active");

      const response = await axios.put(`/api/chats/setNickname`, {chat: chatState.chat, nickname: input.value, user: chatState.chat.users.find(u => u._id === userId)})

      chatState.chat.nicknames = response.data.nicknames;
      activeUserEl.classList.remove("active")

      if(!chatState.chat.customName) {
        document.querySelectorAll(".chatHeader h3").forEach(header => {
          header.textContent = response.data.chatName;
        })
        document.querySelector(".pageTitle span").textContent = response.data.chatName;
      }
      
      const userNameEl = activeUserEl.querySelector(".userNickname__toggle p.initial");
      const descriptionEl = activeUserEl.querySelector(".userNickname__toggle small.initial");
      const modifiedUser = chatState.chat.users.find((u) => u._id === userId);

      userNameEl.textContent = input.value === "" ? modifiedUser.firstName + " " + modifiedUser.lastName : input.value;
      descriptionEl.textContent = input.value === "" ? "Set nickname" : modifiedUser.firstName + " " + modifiedUser.lastName;
    })
  }

  function addWhite(e) {
    
    if(e.target.classList.contains("userNickname__icon") && e.target.classList.contains("initial")) {
      const closestUserNickname = e.target.closest(".userNickname");
      if(closestUserNickname.classList.contains("white")) {
        closestUserNickname.classList.remove("white")
      } else {
        closestUserNickname.classList.add("white");
      }
    }
  }

  function toggleNickname(e) {
    if(e.target.classList.contains("userNickname") || (e.target.classList.contains("userNickname__icon") && e.target.classList.contains("initial"))) {
      console.log("IF", e.target, e.target.classList.contains("userNickname"))
      const target = e.target.closest(".userNickname") ? e.target.closest(".userNickname") : e.target;
      
      if(!target.classList.contains("active")) {
        const currentlyActive = modalChildren.body.querySelector(".active");
        if(currentlyActive) {
          currentlyActive.classList.remove("active");
        }
        
        target.classList.contains("white") && target.classList.remove("white");
        target.classList.add("active");
        const input = target.querySelector("input");
        setTimeout(function(){ input.selectionStart = input.selectionEnd = 10000; }, 0);
        input.focus();
      }
      
    } else {
      if(e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") {
        console.log("ELSE")
        const currentlyActive = modalChildren.body.querySelector(".active");
        if(currentlyActive) {
          currentlyActive.classList.remove("active");
        }
      }
      
    }
  }


  function createNicknameInput(form) {
    let html = "";

    chatState.chat.users.forEach(user => {
      const userId = user._id;
      const userHasNickname = chatState.chat?.nicknames?.hasOwnProperty(userId);
      const username = chatState.chat.nicknames[userId] || user.firstName + " " +  user.lastName
      html += `<div class="userNickname" data-user-id="${userId}">
        <img src="${user.profilePic}" alt="user profilePic" class="profilePic" />
        <div class="userNickname__toggle">
          <p class="initial">${username}</p>
          <small class="initial">${userHasNickname ? user.firstName + " " + user.lastName : "Set nickname"}</small>
          <input 
            type="text" 
            class="setNickName hidden"
            placeholder="${username}"
            value="${userHasNickname ? username : ""}"
            />
        </div>
        <button type="button" class="userNickname__icon initial"><i class="fa-solid fa-pencil"></i></button>
        <button type="submit" class="userNickname__icon hidden"><i class="fa-solid fa-check"></i></button>
      </div>`
    })

    form.insertAdjacentHTML("beforeend", html);

    modalChildren.container.addEventListener("click", toggleNickname);
  }
  

  return {createNicknamesTemplate}
}

function chatNameModal() {
  const modalChildren = {};

  function inputFocus() {
    modalChildren.inputGroup.classList.add("focused")
    modalChildren.inputGroup.classList.add("active")
    modalChildren.inputGroup.querySelector(".counter").classList.remove("d-none")
  }

  function inputBlur(e) {
    if(e.target.value !== "") {
      modalChildren.inputGroup.classList.remove("focused")
    } else {
      modalChildren.inputGroup.classList.remove("focused")
      modalChildren.inputGroup.classList.remove("active")
      modalChildren.inputGroup.querySelector(".counter").classList.add("d-none")
    }
  }

  function onInput(e) {
    
    if(e.target.value.length > 50) {
      e.target.value = e.target.value.slice(0, 50);
    } 
  }

  function keyUp(e, initialInputValue) {
    e.target.nextElementSibling.querySelector("span").textContent = e.target.value.length;


    if(e.target.value !== initialInputValue) {
      modalChildren.buttonSubmit.disabled = false;
    } else {
      console.log("it is", e.target.value, initialInputValue)
      modalChildren.buttonSubmit.disabled = true;
    }
  }
  
  function chatNameModalTemplate() {
    const searchInputId = crypto.randomUUID();
    const chatHasName = chatState.chat.customName;
    const initialInputValue = chatHasName ? chatState.chat.chatName : "";
    const html = `<div class="modal-container center">
                    <div class="modal-close round btn-icon"></div>
                    <div class="modal-header">
                      <h3><strong>Change chat name</strong></h3>
                    </div>
                    <div class="modal-body">
                      <p>Changing the name of a group chat changes it for everyone.</p>
                      <form class="modal-body__chatName-form">
                        <div class="input-group active focused">
                          <label for="${searchInputId}">Chat name</label>
                          <input type="text" id="${searchInputId}" value="${initialInputValue}" />
                          <div class="counter"><span>${initialInputValue.length}</span>/50</div>
                        </div>

                        <div class="modal-body__chatName-form__buttons">
                          <button type="button" class="cancel">Cancel</button>
                          <button type="submit" class="close-prompt" disabled>Save</button>
                        </div>
                      </form>
                    </div>
                  </div>`;

    elements.modifyChatModal.insertAdjacentHTML("beforeend", html);
    modalChildren.form = elements.modifyChatModal.querySelector(".modal-body__chatName-form");
    modalChildren.inputGroup = modalChildren.form.querySelector(".input-group");
    modalChildren.label = modalChildren.inputGroup.querySelector("label");
    modalChildren.input = modalChildren.inputGroup.querySelector("input");
    modalChildren.buttonSubmit = modalChildren.form.querySelector("button[type='submit']");


    
    setTimeout(function(){ modalChildren.input.selectionStart = modalChildren.input.selectionEnd = 10000; }, 0);
    modalChildren.input.focus();

    modalChildren.input.addEventListener("focus", inputFocus);
    modalChildren.input.addEventListener("blur", inputBlur);
    modalChildren.input.addEventListener("keyup", e => keyUp(e, initialInputValue));
    modalChildren.input.addEventListener("input", onInput);

    modalChildren.form.querySelector(".cancel").addEventListener("click", () => {
      elements.modifyChatModal.innerHTML = "";
      closingModalInitialState(elements.modifyChatModal);
    })

    modalChildren.form.addEventListener("submit", async e => {
      e.preventDefault();

      console.log("I am submitted yo", document.getElementById(searchInputId).value)
      
      const newChatName = document.getElementById(searchInputId).value;
      const response = await axios.put("/api/chats/setChatName", {chat: chatState.chat, newChatName});


      chatState.chat.customName = newChatName !== "";

      chatState.chat.chatName = response.data.chatName;

      document.querySelectorAll(".chatHeader h3").forEach(headerEL => headerEL.textContent = response.data.chatName);
      document.querySelector(".pageTitle span").textContent = response.data.chatName;

      elements.modifyChatModal.innerHTML = "";
      closingModalInitialState(elements.modifyChatModal);
    })
  }

  return { chatNameModalTemplate }
}

function displayCustomizeChatOptions(accordionClass) {

  function customizeChatOptionsHTML(accordionBody) {
    // const optionsHTML = ["Change chat name", "Change photo", "Edit nicknames"];
    
    const optionsHTML = [
      `<button class="accordion__body__item" data-action="chatName"><i class="fa-solid fa-pencil accordion__body__item__icon"></i><span>Change chat name</span></button>`,
      `<form class="accordion__body__item" id="chatImageUpload">
        <label for="changeChatPhoto">
          <i class="fa-solid fa-camera accordion__body__item__icon"></i>
          <span>Change photo</span>
        </label>
        <input type="file" name="file" id="changeChatPhoto" />
        <input type="submit" />
      </form>`,
      `<button class="accordion__body__item" data-action="nicknames"><i class="fa-solid fa-a accordion__body__item__icon"></i><span>Edit nicknames</span></button>`,
      `<button class="accordion__body__item" data-action="search"><i class="fa-solid fa-magnifying-glass accordion__body__item__icon"></i><span>Search in conversation</span></button>`
    ];

    for(let option of optionsHTML) {
      accordionBody.insertAdjacentHTML("beforeend", option);
    }
  }

  const { createNicknamesTemplate } = nicknamesModal();
  const { chatNameModalTemplate } = chatNameModal(); 

  const accordionBody = accordionClass.el.querySelector(".accordion__body");
  customizeChatOptionsHTML(accordionBody);


  const fileInput = document.getElementById("changeChatPhoto");

  document.getElementById("chatImageUpload").addEventListener("submit", async e => {
    e.preventDefault();
    // create form data
    const formData = new FormData();
    formData.append("file", fileInput.files[0])
    formData.append("chat", JSON.stringify(chatState.chat))
    try {
      const response = await axios.put("/api/chats/uploadChatImage", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      document.querySelectorAll(".chatPictureContainer").forEach(container => {
        container.innerHTML = "";
        const newImage = document.createElement("img");
        newImage.src = response.data.chatImage;
        newImage.classList.add("big");
        container.appendChild(newImage);
      })

      chatState.chat.chatImage = response.data.chatImage;
    } catch(error) {
      console.log(error);
      alert("Something went wrong with uploading your image to the server");
    }
  })

  fileInput.addEventListener("change", async e => {
    e.target.nextElementSibling.click();
  })

  accordionBody.addEventListener("click", e => {
    switch(e.target.dataset.action) {
      case "nicknames":
        openModal(elements.modifyChatModal, createNicknamesTemplate)
        break;
      case "chatName":
        openModal(elements.modifyChatModal, chatNameModalTemplate)
    }
  })
  
}

function toggleMediaAndFiles(toggleOn = true) {
  const pageOne = document.querySelector(".chatInformation__mainContent__page--1")
  const pageTwo = document.querySelector(".chatInformation__mainContent__page--2")
  Array.from([pageOne, pageTwo]).forEach((page, i) => {
    let className = `chatInformation__mainContent__page--${i + 1}--slide-in-left`
    if(toggleOn) {
      page.classList.add(className)
    } else {
      page.classList.remove(className)
    }
  })
}

function loading(container, additionalClasses) {
  const html = `<div class="loadingDots ${additionalClasses}">
                  <span class="circle"></span>
                  <span class="circle"></span>
                  <span class="circle"></span>
                </div>`

  container.insertAdjacentHTML("beforeend", html);
}

function mediaAndFilesUtilities() {
  const grid = document.querySelector(".mediaAndFiles__grid");

  function createVideoTemplate(video) {
    const container = document.createElement("div");
    ["mediaAndFiles__grid__mediaItem",
     "mediaAndFiles__grid__mediaItem--video"
    ].forEach(classList => container.classList.add(classList))

    container.setAttribute("data-toggle", "imageGalleryModal")
    container.setAttribute("data-category", "media")
    container.id = video.id

    const duration = new Date(video.duration * 1000).toISOString().slice(14, 19);

    container.innerHTML = `<img src="${video.thumbnail}" alt="video thumbnail" />
                           <div class="mediaAndFiles__grid__mediaItem--video__playIcon">
                            <i class="fa-solid fa-play"></i>
                           </div>
                           <div class="mediaAndFiles__grid__mediaItem--video__duration"><span>${duration}</span></div>`

    grid.appendChild(container)
  }

  function createImageTemplate(image) {
    const imgEl = document.createElement("img")
    imgEl.id = image.id
    imgEl.src = image.path
    imgEl.setAttribute("data-toggle", "imageGalleryModal")
    imgEl.setAttribute("data-category", "media")
    imgEl.classList.add("mediaAndFiles__grid__mediaItem")
    grid.appendChild(imgEl)
  }

  function getCurrentModifier(tab) {
    return tab === "media" ? "files" : "media";
  }

  function setGridModifier(modifier) {
    const currentModifier = getCurrentModifier(modifier);
    if(grid.classList.contains(`mediaAndFiles__grid--${currentModifier}`)) {
      grid.classList.replace(`mediaAndFiles__grid--${currentModifier}`, `mediaAndFiles__grid--${modifier}`)
    } else {
      grid.classList.add(`mediaAndFiles__grid--${modifier}`);
    }
    
  }

  function setMediaHTML(media) {
    if(media.length) {
      media.map(m => {
        if(m.mediaType === "image") {
          createImageTemplate(m);
        } else {
          createVideoTemplate(m)
        }
      })
    } else {
      createEmptyMessage("media")
    }
  }

  function createEmptyMessage(targetTab) {
    const heading = `No ${targetTab}`

    let usernames;
    if(!chatState.chat.isGroupChat) {
      const {firstName, lastName} = chatState.chat.users.find(u => u._id !== userLoggedIn._id);
      usernames = `${firstName} ${lastName}`.trim();
    } else {
      usernames = "the group members";
    }
    const subHeading = `${targetTab === "media" ? "Photos and videos" : "Files"} that you exchange with ${usernames} will appear here.`

    grid.innerHTML = `<div class="mediaAndFiles__grid__empty">
                        <p>${heading}</p>
                        <p>${subHeading}</p>
                      </div>`
  }

  function setFilesHTML(files) {
    if(files.length) {
      for(let file of files) {
        const fileHTML = fileLayout(null, file);
        const fileContainer = document.createElement("button");
        fileContainer.classList.add("mediaAndFiles__grid--files__file")
        fileContainer.setAttribute("data-toggle", "imageGalleryModal")
        fileContainer.id = file.id;
        fileContainer.setAttribute("data-category", "files")
        fileContainer.insertAdjacentHTML("beforeend", fileHTML);
        grid.appendChild(fileContainer);
      }
    } else {
      createEmptyMessage("files")
    }
  }

  function convertMediaMessagesArrayToSingularEntity(array) {
    // a message with images can have multiple items
    // but a message with can only one video
    // so without this function, it would look like this => [ ARRAY(images), singleObject(video), singleObject, Array, singleObject ]
    let singularEntity = [];
    let messagesWithMedia = array || chatState.messages.slice().reverse();

    messagesWithMedia.filter(msg => msg.media.length > 0 && (msg.media[0].mediaType === "image" || msg.media[0].mediaType === "video"));

    for(let message of messagesWithMedia) {
      const media = message.media;

      for(let m of media) {
        singularEntity.push({...m, id: crypto.randomUUID()})
      }
    }

    return singularEntity;
  }

  function getMediaAndFilesByState(targetTab) {
    setGridModifier(targetTab)
    grid.innerHTML = "";
    // image/video, file
    switch (targetTab) {
      case "media":
        if(!chatState[targetTab].length) {
          chatState[targetTab] = convertMediaMessagesArrayToSingularEntity();
        }
        setMediaHTML(chatState[targetTab])
        break;
      case "files":
        if(!chatState[targetTab].length) {
          chatState[targetTab] = chatState.messages.filter(msg => msg.media.length > 0 && msg.media[0].mediaType === "file").map(msg => ({...msg.media[0], id: crypto.randomUUID()}));
        }
        setFilesHTML(chatState[targetTab])
        break;
    }
    
  }

  async function fetchMedia() {
    const { data } = await axios.get(`/api/chats/fetchMedia/${chatState.chat._id}/media`);
    chatState["media"] = convertMediaMessagesArrayToSingularEntity(data);
  }

  async function fetchFiles() {
    const { data } = await axios.get(`/api/chats/fetchMedia/${chatState.chat._id}/files`);
    chatState["files"] = data.map(msg => ({...msg.media[0], id: crypto.randomUUID()}));
  }

  async function fetchMediaAndFilesFromDB(targetTab) {
    const currentModifier = getCurrentModifier(targetTab);
    grid.classList.remove(`mediaAndFiles__grid--${currentModifier}`)
    grid.innerHTML = "";
    loading(grid)
    try {
      const { data } = await axios.get(`/api/chats/fetchMedia/${chatState.chat._id}/${targetTab}`);
      
      setGridModifier(targetTab)

      if(targetTab === "media") {
        chatState[targetTab] = convertMediaMessagesArrayToSingularEntity(data)
        setMediaHTML(chatState[targetTab])
      } else if(targetTab === "files") {
        chatState[targetTab] = data.map(msg => ({...msg.media[0], id: crypto.randomUUID()}));
        setFilesHTML(chatState[targetTab])
      }

    } catch(error) {
      console.log(error)
    } finally {
      // delete spinner
      grid.querySelector(".loadingDots")?.remove();
    }
  }

  async function getFilesAndMedia(targetTab) {
    if((!chatState.fetchMoreMessages.top && !chatState.fetchMoreMessages.bottom) || chatState[targetTab].length > 0) {
      getMediaAndFilesByState(targetTab);
    } else {
      await fetchMediaAndFilesFromDB(targetTab)
    }
  }

  return { getFilesAndMedia, fetchMedia, fetchFiles }
}

function setMediaAndFilesAttributes(target) {
  const body = target.el.querySelector(".accordion__body")
  body.setAttribute("data-opened", false)

  for(let i = 0; i <= 1; i++) {
    let headerText = i === 0 ? "Media" : "Files";
    let headerIcon = i === 0 ? `<i class="fa-solid fa-photo-film accordion__body__item__icon"></i>` : `<i class="fa-solid fa-file accordion__body__item__icon"></i>`
    let target = i === 0 ? "media" : "files";

    const item = document.createElement("button");
    item.classList.add("accordion__body__item");
    item.classList.add("bubbleButton")
    new BubbleButton(item, "lightgrey", 100)
    item.setAttribute("data-target", target);
    item.innerHTML = `${headerIcon} <span>${headerText}</span>`;
    
    body.appendChild(item);
  }

  const { getFilesAndMedia } = mediaAndFilesUtilities()

  body.addEventListener("click", async e => {
    if(e.target.classList.contains("accordion__body__item")) {
      toggleMediaAndFiles()
      const targetTab = e.target.dataset.target;
      document.querySelectorAll(".mediaAndFiles__category-options li").forEach(el => {
        console.log(targetTab, el.dataset.category)
        if(el.dataset.category === targetTab) {
          el.classList.add("active")
        } else {
          el.classList.remove("active")
        }
      })
      await getFilesAndMedia(targetTab);
      
    }
  })
}

function createMediaAndFilesContainer(appendTo) {
  const mediaAndFiles = document.createElement("div");
  mediaAndFiles.classList.add("mediaAndFiles");

  mediaAndFiles.innerHTML = `
    <div class="mediaAndFiles__header">
      <button class="mediaAndFiles__header__close"><i class="fa-solid fa-arrow-left"></i></button>
      <h3>Media and files</h3>
    </div>
    <ul class="mediaAndFiles__category-options inline-tabs">
      <li data-category="media">Media</li>
      <li data-category="files">Files</li>
    </ul>
    <div class="mediaAndFiles__grid">

    </div>
  `
  appendTo.appendChild(mediaAndFiles);

  const closeBtn = document.querySelector(".mediaAndFiles__header__close")
  const inlineOptions = document.querySelector(".mediaAndFiles__category-options")

  const { getFilesAndMedia } = mediaAndFilesUtilities();
  
  inlineOptions.addEventListener("click", async e => {
    selectActiveInlineTab(e)
    await getFilesAndMedia(e.target.dataset.category)
  });

  closeBtn.addEventListener("click", () => toggleMediaAndFiles(false))
}

function chatInfoPages(container, pages) {
  const pageEls = [];
  for(let i = 0; i < pages; i++) {
    const page = document.createElement("div");
    page.classList.add(`${container.classList[0]}__page--${i + 1}`);
    container.appendChild(page);
    pageEls.push(page);
  }

  return pageEls;
}

function toggleConvoInfo(e) {
  chatInformationContainer.classList.toggle("show")
  chatInformationContainer.classList.add(chatInformationContainer.id)

  if(chatInformationContainer.classList.contains("show")) {
    navigateBackButton.removeEventListener("click", goBack)
    navigateBackButton.addEventListener("click", hideChatDetails)
  }

  if(chatInformationContainer.dataset.init === "true") {
    createChatHeader(chatState.chat, chatInformationContainer)

    const chatInformationMainContent = document.createElement("div");
    chatInformationMainContent.classList.add("chatInformation__mainContent");
    chatInformationContainer.appendChild(chatInformationMainContent)

    const pages = chatInfoPages(chatInformationMainContent, 2);
    createMediaAndFilesContainer(pages[1])

    chatInformationContainer.setAttribute("data-init", false);

    const chatType = chatState.chat.isGroupChat ? "group" : "duet";
    let chatFeatures = {
      duet: ["Media and files"],
      group: ["Customize chat", "Chat members", "Media and files"]
    }
    let tabs = {
      "Customize chat": {
        init: displayCustomizeChatOptions,
        active: true,
        additionalClasses: "accordion__customize_chat"
      },
      "Chat members": {
        init: displayChatMembersToAccordion,
        active: true,
        additionalClasses: "accordion__chatMembers"
      },
      "Media and files": {
        active: true,
        init: setMediaAndFilesAttributes,
      }, 
    }

    for(let feature of chatFeatures[chatType]) {
      const accordion = document.createElement("div");
      accordion.classList.add("accordion");
      pages[0].appendChild(accordion);
      const featureOptions = tabs[feature];
      new Accordion(accordion, feature, featureOptions);
    }
  }

}

function appendConvoInformationButtonToPageHeader() {
  if(chatState.chat) {
    const pageHeader = document.querySelector("header.header");
    pageHeader.classList.add("chats");
    const navigateTo = document.createElement("button");
    navigateTo.classList.add("goTo-convoInfo");
    navigateTo.setAttribute("data-toggle", "tooltip");
    navigateTo.setAttribute("data-title", "Conversation information");
    navigateTo.setAttribute("data-tooltip-type", "large");
    navigateTo.setAttribute("data-delay", "300");
    navigateTo.textContent = "i";
    pageHeader.appendChild(navigateTo);
    navigateTo.addEventListener("click", toggleConvoInfo)
  }
}

function createSideToSidePictures(container, chat) {
  container.innerHTML = "";
  let imageElements = "";
  const chatUsers = chat.users.filter(u => u._id !== userLoggedIn._id).slice(0, 15);

  chatUsers.forEach((u, index, array) => {
    // 50% - arrayItems * ( pictureWidth[2.5rem] - pictureOffset[1.5rem] ) + left * currentIndex
    const offset = `calc((50% - ${array.length - 1} * 1rem) + 2rem * ${index})`;
    const zIndex = `${(array.length - 1) - index}`
    imageElements += `<img src="${u.profilePic}" alt="user picture" class="multiple" style="left:${offset}; z-index: ${zIndex};"/>`
  })

  container.insertAdjacentHTML("beforeend", imageElements);
}

async function createChatHeader(chat, container) {

  const chatHeaderActions = () => {
    const actionsContainer = document.createElement("div");
    actionsContainer.classList.add("chatHeader__actions");

    const searchActionHTML = `<div class="chatHeader__actions__actionContainer">
      <button class="chatHeader__actions__action" data-action="search">
        <i class="fa-solid fa-magnifying-glass"></i>
      </button>
      <p>Search</p>
    </div>`

    actionsContainer.insertAdjacentHTML("beforeend", searchActionHTML)

    return actionsContainer;
  }

  if(!container.querySelector(".chatHeader")) {
    const chatHeaderEl = document.createElement("div");
    chatHeaderEl.classList.add("chatHeader");
  
    const chatPictureEl = document.createElement("div");
    chatPictureEl.classList.add("chatPictureContainer");
  
    const chatNameEl = document.createElement("h3");
    chatNameEl.textContent = document.querySelector(".pageTitle span").textContent;

    const elements = [chatPictureEl, chatNameEl]
  
    
    if(chat) {

      if(chatState.messages.length) {
        elements.push(chatHeaderActions())
      }
      
      if(chat.isGroupChat) {
  
        if(chat.chatImage) {
          let chatPictureImg = document.createElement("img");
          chatPictureImg.src = chat.chatImage;
          chatPictureImg.classList.add("big");
          chatPictureEl.appendChild(chatPictureImg)
        } else {
          createSideToSidePictures(chatPictureEl, chat)
        }
    
      } else {
        const otherUser = chat.users.find(u => u._id !== userLoggedIn._id);
        chatPictureEl.insertAdjacentHTML("beforeend", `<img src="${otherUser.profilePic}" alt="user picture" />`)
      }
    } else {
      // There's no interaction with that user, no messages sent, no chat id
      const userId = window.location.pathname.split("/").pop();
      let profilePicSRC = "";
      if(userId !== userLoggedIn._id) {
        const {data: otherUser} = await axios.get(`/api/users/${userId}`);
        profilePicSRC = otherUser ? otherUser.profilePic : `/images/profilePic.png`;
      } else {
        profilePicSRC = userLoggedIn.profilePic;
      }
      
      
      chatPictureEl.insertAdjacentHTML("beforeend", `<img src="${profilePicSRC}" alt="user picture" />`)
    }
    
    elements.forEach(el => chatHeaderEl.appendChild(el))
    container.insertBefore(chatHeaderEl, container.firstElementChild);
  }

}

function constructMessages(messages, reverse = false) {
  messages.forEach((msg, index, array) => {
    const you = msg?.sentBy?._id == userLoggedIn._id;
    if(msg.media.length) {
      const mediaType = msg.media[0].mediaType;
      switch(mediaType) {
        case "image":
          createImageGalleryMessage(msg.media, you, msg, index, array, reverse)
          break;
        case "video":
          createVideoTypeMessage(msg.media[0], you, msg, index, array, reverse)
          break;
        case "file":
          createFileTypeMessage(msg.media[0], you, msg, index, array, reverse)
      }
    } else {

      switch(msg.messageType) {
        case "regular":
          createTextMessage(msg, you, index, array, reverse)
          break;
        case "info":
          createInfoMessage(msg, reverse)
          break;
        case "delete": 
          createDeleteMessage(msg, you, reverse);
      }

    } 
  })
}




function createInfoMessage(msg, reverse) {
  const messageContainer = document.createElement("div"); 
  messageContainer.classList.add("messageContainer");
  messageContainer.classList.add("info");
  const p = document.createElement("p");
  p.textContent = msg.text;
  messageContainer.appendChild(p);
  if(reverse) {
    chatMessagesContainer.insertBefore(messageContainer, chatMessagesContainer.firstChild);
  } else {
    chatMessagesContainer.appendChild(messageContainer);
  }
}



function createTextMessage(msg, you, index, array, reverse) {

  const p = document.createElement("p");
  p.textContent = msg.text;
  const messageContainer = messageContainerHTML({insertion: p, type: "DOM"}, you, msg, index, array, reverse);
  messageContainer.classList.add("textMessage");

  if(p.textContent.length < 20) {
    const reactionOptionsWindow = messageContainer.querySelector(".msg-options__option.react .option-window")
    reactionOptionsWindow.style.left = you ? '-80px' : '100px';
  }

  if(reverse) {
    chatMessagesContainer.insertBefore(messageContainer, chatMessagesContainer.firstChild);
  } else {
    chatMessagesContainer.appendChild(messageContainer);
  }
  

  function textLines(messageContainer) {
    const lineHeight = 22;
    const messageHeight = messageContainer.offsetHeight;
    return messageHeight / lineHeight;
  }
  
  if(textLines(messageContainer) > 2) messageContainer.classList.add("edgier")
}

function setContentEditableValue(target) {
  const content = target.nextElementSibling;
  content.innerHTML = target.value;
}

function resizeTextarea(target) {
  const content = target.nextElementSibling;
  target.style.height = "5px";
  target.style.height = target.scrollHeight + "px";
  content.style.height = target.scrollHeight + "px";
}

function disableButton(value) {
  submitBtn.disabled = !value.length >= 1;
}

function resetReplyingTo(el) {
  chatState.replyingTo = {};
  el.querySelector(".replyingTo__user")?.remove();
  el.querySelector(".replyingTo__messageText")?.remove();
  el.classList.remove("active");
}

function createReplyFlag(message) {
  replyingTo.querySelector(".replyingTo__user")?.remove();
  replyingTo.querySelector(".replyingTo__messageText")?.remove();
  const {text: replyText, sentBy: {firstName, lastName, _id: replyToId}} = message;
  const replyToUserName = chatState.chat.nicknames[replyToId] || `${firstName} ${lastName}`
  let replyToUser = replyToId === userLoggedIn._id ? "youself" : `<span>${replyToUserName}</span>`;
  const header = document.createElement("p");
  header.classList.add("replyingTo__user");
  header.innerHTML = `Replying to ${replyToUser}`
  const replyMessageText = document.createElement("p");
  replyMessageText.classList.add("replyingTo__messageText");
  replyMessageText.textContent = replyText.length > 130 ? replyText.slice(0, 130) + "..." : replyText;

  replyingTo.classList.add("active");
  replyingTo.appendChild(header);
  replyingTo.appendChild(replyMessageText);
  chatState.replyingTo = message;

  messageTextarea.focus();
}

function resetForm() {
  resetReplyingTo(replyingTo)
  const textarea = messageForm.querySelector("textarea");
  const textareaContentEditable = textarea.nextElementSibling;
  const button = messageForm.querySelector("button[type='submit']");
  console.log(chatState.chat)
  textarea.value = "";
  textareaContentEditable.innerHTML = textarea.value;
  textarea.style.height = "auto";
  textareaContentEditable.style.height = "auto";
  button.disabled = true;
  
  setTimeout(() => {
    const tooltip = button.querySelector(".tooltip");
    if(tooltip) {
      tooltip.remove();
    }
  }, 500)
  
}

function messageTextareaOperations(e) {
  resizeTextarea(e.target);
  setContentEditableValue(e.target)
  disableButton(e.target.value);

  typingIndicator()
}

function typingIndicator() {
  if(!connected || !chatState.chat) return;

  if(!userIsTyping) {
    userIsTyping = true;
    console.log(chatState.chat)
    socket.emit("userIsTyping", {user: chatState.chat.nicknames[userLoggedIn._id] || userLoggedIn.firstName, chat: chatState.chat});
  }

  lastTypingTime = new Date().getTime();
  let timerLength = 3000;

  setTimeout(() => {
    let timeNow = new Date().getTime();
    let timeDiff = timeNow - lastTypingTime;

    if(timeDiff >= timerLength && userIsTyping) {
      socket.emit("userStoppedTyping", {user: chatState.chat.nicknames[userLoggedIn._id] || userLoggedIn.firstName, chat: chatState.chat});
      userIsTyping = false;
    }
  }, timerLength)

  
}

messageTextarea.addEventListener("input", messageTextareaOperations)
messageTextarea.addEventListener("blur", deleteUserTempFiles)
new EmojiSelection(emojiToggleBtn, "searchEmoji-messages", messageTextarea, true);
Dropzone.autoDiscover = false;
const mediaSelection = new UploadFiles(mediaBtn, { 
  url: "/uploads/dropzone/multiple/",
  previewsContainer,
  previewTemplate: uploadMultipleTemplate,
  paramName: "files",
  uploadMultiple: true,
  parallelUploads: 12,
  acceptedFiles: "image/*, .mp4, .mkv, .avi, .pdf, .doc, .docx, .xls, .xlsx, .csv, .txt, .ppt, .pptx",
  maxFiles: 12,
  maxFilesize: 72
}, submitBtn)

// chatMessagesContainer

function sentAtTime(date, additionalMessages) {
  const momentJsDate = moment(date, "YYYY MMMM mm DD dddd HH:mm");
  const day = momentJsDate.format("dddd");
  const time = momentJsDate.format("HH:mm");
  const year = momentJsDate.format("YYYY");
  const month = momentJsDate.format("MMMM")
  const monthDayNumber = momentJsDate.format("DD")


  let customMessages = {
   seconds: time,
   minutes: time,
   hours: time,
   days: day + " " + time,
   moreThanWeek: `${monthDayNumber} ${month} ${year} at ${time}`,
   ...additionalMessages
  }
  return timeDifference(new Date(), date, customMessages);
}


function fileLayout(msg, file) {
  let image, containerClass, wrapperEl = "div", dataAttributes = "";
  const ext = file.originalname.split(".").pop().toLowerCase();
  const isOffice = ext === "pdf" || ext === "doc" || ext === "docx" || ext === "xls" || ext === "xlsx" || ext === "ppt" || ext === "pptx";


  if(msg && file.thumbnail) {
    image = isOffice ? `<img src="${file.thumbnail}" />` : file.thumbnail;
    containerClass = isOffice ? "officeLayout" : "generalFileLayout";
    wrapperEl = "button";
    dataAttributes = `data-toggle="imageGalleryModal" data-category="files" data-filename=${file.filename}`
  } else if(isOffice) {
    image = `<img src="/icons/officeIcons/${ext.length > 3 ? ext.substring(0, 3) : ext}.png" />`;
    containerClass = "officeLayout";
  } else {
    image = file.thumbnail;
    containerClass = "generalFileLayout";
  }

  return `<${wrapperEl} class="${containerClass}" ${dataAttributes}>
            <div class="image">
              ${image}
            </div>
            <div class="details">
              <div class="filename">
                <p>${file.originalname}</p>
              </div>
              <div class="size">
                <span class="muted">${formatBytes(file.size)}</span>
              </div>
            </div>
          </${wrapperEl}>`
}

function createFileTypeMessage(file, you = true, msg = null, index, array, reverse) {

  const fileHTML = fileLayout(msg, file)

  const messageContainer = messageContainerHTML({insertion: fileHTML, type: "text/html"}, you, msg, index, array, reverse);
  messageContainer.classList.add("fileMessage")

  if(reverse) {
    chatMessagesContainer.insertBefore(messageContainer, chatMessagesContainer.firstChild);
  } else {
    chatMessagesContainer.appendChild(messageContainer);
  }
}


function createFileTypeMessages(files, you = true, index = 0, array = []) {
  for(let i = 0; i <= files.length - 1; i++) {
    const file = files[i];
    createFileTypeMessage(file, you)
  }
}

function setTooltipTime(elem, time, offset) {
  elem.setAttribute("data-toggle", "tooltip");
  elem.setAttribute("data-title", time);
  elem.setAttribute("data-tooltip-type", "large");
  elem.setAttribute("data-delay", "300");
  elem.setAttribute("data-message-tooltip", true)
  elem.setAttribute("offset", offset)
}

function optionsBoilerplate(msg, els, you) {
  
  const optionsHTML = {
    react: `<ul class="option-window">
      ${Object.keys(chatState.mainReactionEmoji).map(emojiKey => (`<li class="reaction" data-emoji-name="${chatState.mainReactionEmoji[emojiKey]}">${emojiKey}</li>`)).join("")}
    </ul>`,
    delete: `<ul class="option-window">
      <li data-delete="you">Delete for you</li>
      ${(you || chatState.chat.admin.find(id => id === userLoggedIn._id)) && msg.messageType !== "delete" ? "<li data-delete='everyone'>Delete for everyone</li>" : ""}
    </ul>` 
  }

  els.forEach(el => {
    el.classList.contains("react") ? el.insertAdjacentHTML("afterbegin", optionsHTML["react"]) : el.insertAdjacentHTML("afterbegin", optionsHTML["delete"])
  })
}

function pickOptions(optionsPicked) {

  const options = {
    react: `<li class="msg-options__option react"
              data-toggle="tooltip"
              data-title="React"
              data-tooltip-type="large"
              data-delay="1">
              <i class="fa-regular fa-face-smile"></i>
            </li>`,
    reply: `<li class="msg-options__option reply"
              data-toggle="tooltip"
              data-title="Reply"
              data-tooltip-type="large"
              data-delay="1">
              <i class="fa-solid fa-reply"></i>
            </li>`,
    more:   `<li class="msg-options__option more"
                data-toggle="tooltip"
                data-title="More"
                data-tooltip-type="large"
                data-delay="1">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </li>`
  }

  return optionsPicked.map(opt => options[opt]);

}

function createMessageOptions(msg, container, you, optionsPicked) {
  
  let options = pickOptions(optionsPicked);

  options = you ? options.reverse() : options;

  const optionsContainer = document.createElement("ul");
  optionsContainer.classList.add("msg-options");
  optionsContainer.classList.add("muted");

  
  optionsContainer.insertAdjacentHTML("afterbegin", options.map(opt => opt).join(""))

  optionsBoilerplate(msg, optionsContainer.querySelectorAll(".msg-options__option:not(.reply)"), you);

  // you ? container.prepend(optionsContainer) : container.append(optionsContainer)
  container.append(optionsContainer)
}

function addSenderName(sentBy, messageContainer) {
  const span = document.createElement("span");
  span.classList.add("sentBy-heading");
  span.classList.add("muted")
  const senderName = chatState.chat.isGroupChat ? chatState.chat.nicknames[sentBy._id] || sentBy.firstName + " " + sentBy.lastName : sentBy.firstName;
  span.textContent = senderName.trim();
  messageContainer.appendChild(span);
}

function addSenderProfilePic(sentBy, messageContainer) {
  let senderName = chatState.chat.isGroupChat ? chatState.chat.nicknames[sentBy._id] || sentBy.firstName + " " + sentBy.lastName : sentBy.firstName;
  senderName = senderName.trim();
  const profileImage = `<div class="sentBy-profilePic">
    <img src="${sentBy.profilePic}" alt="${senderName}" />
  </div>`
  messageContainer.insertAdjacentHTML('afterbegin', profileImage);
}

function addMessageStatus(msg, you, messageStatusContainer) {
  let html = "";

  if(msg) {
    if(msg.seen.length) {
      msg.seen.sort((a, b) => new Date(a.at) - new Date(b.at)).forEach(seenObject => {
        const date = moment(new Date(seenObject.at));
        let seenTime = sentAtTime(date, {justNow: moment.utc(date).format('HH:mm')})
        let viewerName = chatState.chat.nicknames[seenObject.user._id] || seenObject.user.firstName + " " + seenObject.user.lastName;
        viewerName.trim();
        html += `<div class="seenBy hidden" data-user-id="${seenObject.user._id}">
                      <img src="${seenObject.user.profilePic}" />
                      <div class="seenBy__details"><p>Seen by ${viewerName} at ${seenTime}</p></div>
                  </div>`
      })

      setTimeout(() => {
        messageStatusContainer.querySelectorAll(".seenBy").forEach(el => el.classList.remove("hidden"))
      }, 300)
      
    } else {
      if(you) {
        const indexOfCurrentMessage = chatState.messages.indexOf(msg);
        if(indexOfCurrentMessage == chatState.messages.length - 1) {
          html = `<i class="fa-solid fa-circle-check messageStatus__status"></i>`
        }
      }      
    }
  } else {
    // add the unsend flag
    html = `<div class="notSent messageStatus__status"></div>`
  }

  messageStatusContainer.insertAdjacentHTML("beforeend", html);
}

function setMessageReactions(reactions, messageMainContentContainer) {
  const emojisObj = {}

  if(reactions.length) {
    const reactionContainer = document.createElement("div");
    reactionContainer.classList.add("reactionsDisplay");
    reactionContainer.setAttribute("data-toggle", "tooltip");
    reactionContainer.setAttribute("data-tooltip-type", "large");
    reactionContainer.setAttribute("data-delay", "300");
    let names = "";

    reactions.forEach(({user, emoji}) => {
      const userDisplayName = chatState.chat.nicknames[user._id] || user.firstName + " " + user.lastName;
      names += `${userDisplayName.trim()} \n`;
      emojisObj[chatState.mainReactionEmoji[emoji]] = emoji;
    })
    reactionContainer.setAttribute("data-title", names);
    
    for(let key of Object.keys(emojisObj)) {
      const emojiSpan = document.createElement("span");
      emojiSpan.setAttribute("name", key);
      emojiSpan.textContent = emojisObj[key];
      reactionContainer.appendChild(emojiSpan);
    }

    if(reactions.length > 1) {
      const count = document.createElement("span");
      count.classList.add("reactionCount");
      count.textContent = reactions.length;
      reactionContainer.appendChild(count);
    }

    messageMainContentContainer.appendChild(reactionContainer)
  }
}

function replyCloud(originalMessage, you, messageContainer) {
  if(originalMessage.isReplyTo) {
    messageContainer.querySelector(".sentBy-heading")?.remove();
    const {isReplyTo: replyMessage, sentBy: {_id: originalSenderId, firstName: originalSenderFn, lastName: originalSenderLn}} = originalMessage
    const {_id: replyMessageId, text: replyText, sentBy: {_id: replySenderId, firstName, lastName}} = replyMessage;
    const replyContainer = document.createElement("div");
    replyContainer.classList.add("replyContainer");
    replyContainer.classList.add("muted")

    const replyHeader = document.createElement("p");
    replyHeader.classList.add("replyHeader");
    

    let replyHeaderText;
    const sender = chatState.chat.nicknames[originalSenderId] || `${originalSenderFn} ${originalSenderLn}`.trim();
    const replyToName = chatState.chat.nicknames[replySenderId] || `${firstName} ${lastName}`.trim();
    if(originalSenderId === replySenderId) {
      replyHeaderText = `${you ? "You" : sender} replied to ${you ? "yourself" : "themself"}`
    } else {
      replyHeaderText = `${you ? "You" : sender} replied to ${replyToName}`
    }

    replyHeader.innerHTML = `<i class="fa-solid fa-reply"></i>${replyHeaderText}`;

    const replyCloud = document.createElement("a");
    replyCloud.href = `#${replyMessageId}`
    replyCloud.classList.add("replyCloud");
    replyCloud.textContent = replyText;

    replyContainer.append(replyHeader, replyCloud);
    messageContainer.appendChild(replyContainer);
  }
 
}

function getLastMessageContainerByData(currentIndex, sender) {
  const nextMsg = chatState.messages[currentIndex + 1];
  if(sender === nextMsg?.sentBy?._id && nextMsg.messageType !== "delete") {
    console.log("How many times do i run?")
    return getLastMessageContainerByData(currentIndex + 1, nextMsg.sentBy._id)
  }

  return currentIndex;
}


function quickFix(currentIndex, lastMessageIndex) {
  if(lastMessageIndex > currentIndex) {
    const targetMessages = chatState.messages.slice(currentIndex + 1, lastMessageIndex + 1).reverse();
    let cursor = 0;
    for(let item of targetMessages) {
      const targetEl = document.getElementById(`${item._id}`);
      targetEl.classList.remove("topOne");
      targetEl.classList.remove("middle");
      targetEl.querySelector(".sentBy-heading")?.remove();

      if(cursor == 0) {
        targetEl.classList.remove("mt-2");
        targetEl.classList.add('lastOne');
      } else {  
        targetEl.querySelector(".sentBy-profilePic")?.remove();
        targetEl.classList.remove("lastOne");
        targetEl.classList.add("middle")
        targetEl.classList.remove("mt-auto");
      }

      cursor++;
    }
  }
}

function msgPlacementByData(messageContainer, currentMsg, index, array) {
  const chatStateIndex = (array.length - 1) - index;
  const prevMsg = chatState.messages[chatStateIndex - 1];
  const nextMsg = chatState.messages[chatStateIndex + 1];
  const prevSender = prevMsg?.sentBy?._id;
  const nextSender = nextMsg?.sentBy?._id;
  const sender = currentMsg.sentBy._id;
  const prevMsgType = prevMsg?.messageType;
  const nextMsgType = nextMsg?.messageType;

  if(index == 0) {
    // get the last item(messageContainer) that is the same user as currentMsg
    const lastUserMessageIndex = getLastMessageContainerByData(chatStateIndex, sender);
    // select items from currentIndex through lastMessageIndex
    quickFix(chatStateIndex, lastUserMessageIndex)
  }

  if(prevSender !== sender && nextSender !== sender || prevMsgType === "delete" && nextMsgType === "delete") return;

  if(prevSender === sender && nextSender === sender && nextMsgType !== "delete" && prevMsgType !== "delete") {
    messageContainer.classList.add("middle");
  } else if(prevSender !== sender && nextMsg && nextMsgType !== "delete" || prevMsgType === "delete" && nextMsgType !== "delete" && prevMsg) {
    messageContainer.classList.add("topOne");
  } else if(nextSender !== sender && prevMsg && prevMsgType !== "delete"|| nextMsgType === "delete" && prevMsgType !== "delete" && prevMsg) {
    messageContainer.classList.add("lastOne");
  }
}

const messageContainerUtils = (() => {

  function createElement(classList) {
    const element = document.createElement("div");
    element.classList.add(...classList);
    return element;
  }

  return {createElement}
})()

function deleteMessageMarkup(msg, you) {
  const { createElement } = messageContainerUtils;
  const messageContainer = createElement(["messageContainer", you ? "you" : "others", "deleteType", "textMessage"]);
  const mainWrapper = createElement(["message-main-wrapper"]); 
  const mainContent = createElement(["mainContent"]);
  const messageStatus = createElement(["messageStatus"]);

  addMessageStatus(msg, you, messageStatus);

  const sentTime = sentAtTime(new Date(msg.createdAt));
  const unsentTime = sentAtTime(new Date(msg.updatedAt));

  messageContainer.setAttribute("id", msg._id);

  if(!you) {
    addSenderName(msg.sentBy, messageContainer)
    addSenderProfilePic(msg.sentBy, mainWrapper);
  }

  createMessageOptions(msg, mainWrapper, you, ["more"]);
  setTooltipTime(mainContent, `Sent: ${sentTime}\nUnsent: ${unsentTime}`, 46);

  const text = document.createElement("p");
  text.textContent = msg.text;
  mainContent.appendChild(text);

  mainWrapper.append(mainContent, messageStatus)

  messageContainer.appendChild(mainWrapper);

  return messageContainer;
}

function createDeleteMessage(msg, you, reverse) {
  const messageContainer = deleteMessageMarkup(msg, you);
  
  if(reverse) {
    chatMessagesContainer.insertBefore(messageContainer, chatMessagesContainer.firstChild);
  } else {
    chatMessagesContainer.appendChild(messageContainer);
  }

}

function messageContainerHTML(children, you = true, msg = null, index, array, reverse) {
  let sentBy = userLoggedIn._id;
  const { createElement } = messageContainerUtils;
  const messageContainer = createElement(["messageContainer", you ? "you" : "others"]);
  const mainWrapper = createElement(["message-main-wrapper"]); 
  const mainContent = createElement(["mainContent"]);
  const messageStatus = createElement(["messageStatus"]);
  
  // add seen flag
  addMessageStatus(msg, you, messageStatus);

  let sentAt = sentAtTime(new Date())
  if(msg) {
    messageContainer.setAttribute("id", msg._id)
    // In what case does msg not exist?
    // When you send media...files/videos/images since you add them to the DOM before they even upload
    if(chatState.messages.length <= 2) {
      const firstMessageContainer = chatMessagesContainer.querySelector(".messageContainer:not(.info)");
      !firstMessageContainer && messageContainer.classList.add("mt-auto");
    }
    setMessageReactions(msg.reactions, mainContent);
    
    sentAt = sentAtTime(new Date(msg.createdAt));
    sentBy = msg.sentBy._id;
    
    if(!you) {
      const msgIndex = chatState.messages.indexOf(msg);
      const previousSender = chatState?.messages[msgIndex - 1]?.sentBy?._id;
      const nextSender = chatState?.messages[msgIndex + 1]?.sentBy?._id;
      const previousMessageType = chatState?.messages[msgIndex - 1]?.messageType;
      const nextMessageType = chatState?.messages[msgIndex + 1]?.messageType;
      
      if(!previousSender || previousSender !== sentBy || previousMessageType !== "regular") {
        addSenderName(msg.sentBy, messageContainer)
      }

      if(!nextSender || nextSender !== sentBy || nextMessageType !== "regular") {
        addSenderProfilePic(msg.sentBy, mainWrapper);
      }

      if((!previousSender || previousSender !== sentBy) && (!nextSender || nextSender !== sentBy) || (previousMessageType !== "regular" && nextMessageType !== "regular")) {
        messageContainer.classList.add("mt-2");
      }
    }

    
    createMessageOptions(msg, mainWrapper, you, ["react", "reply", "more"]);
    replyCloud(msg, you, messageContainer);
  }
  messageContainer.setAttribute("data-sent-by", sentBy);
  
  if(!reverse) {
    msgPlacement(messageContainer)
  } else {
    msgPlacementByData(messageContainer, msg, index, array)
  }
    
  setTooltipTime(mainContent, sentAt, 29);
  

  let childrenArr = !Array.isArray(children) ? Array.from([children]) : children;
  childrenArr.forEach(child => {
    if(child.type === "DOM") {
      mainContent.appendChild(child.insertion);
    } else {
      mainContent.insertAdjacentHTML("beforeend", child.insertion)
    }
  })

  
  mainWrapper.append(mainContent, messageStatus)

  messageContainer.appendChild(mainWrapper);
  
  return messageContainer;
}

function setVideoFullScreenCloak(video) {
  const fullscreenCloak = document.createElement("div");
  fullscreenCloak.classList.add("videoCloak");
  fullscreenCloak.setAttribute("data-toggle", "imageGalleryModal");
  fullscreenCloak.setAttribute("data-category", "media")
  fullscreenCloak.setAttribute("data-videoPath", video.path)

  return fullscreenCloak;
}

function createVideoTypeMessage(video, you = null, msg = null, index, array, reverse) {
  const videoPlayer = document.createElement("video");
  videoPlayer.setAttribute('src', msg ? video.path : window.location.origin + video.path);
  videoPlayer.setAttribute('controls', "controls");
  videoPlayer.setAttribute("preload", "none");
  videoPlayer.setAttribute("poster", video.thumbnail);
  videoPlayer.muted = true;

  const insertedElements = [{insertion: videoPlayer, type: "DOM"}]
  if(msg) {
    insertedElements.push({insertion: setVideoFullScreenCloak(video), type: "DOM"})
  }
  
  const messageContainer = messageContainerHTML(insertedElements, you, msg, index, array, reverse);
  if(reverse) {
    chatMessagesContainer.insertBefore(messageContainer, chatMessagesContainer.firstChild);
  } else {
    chatMessagesContainer.appendChild(messageContainer);
  }
}

function createVideoTypeMessages(videos, you = true) {
  videos.forEach(video => {
    createVideoTypeMessage(video, you);
  })
}

function createImageGalleryMessage(images, you = null, msg = null, index, array, reverse) {
  const grid = document.createElement("div");
  grid.classList.add("messageGrid");
  images.length === 2 && grid.classList.add("square-it");
  images.length >= 3 && grid.classList.add("square-it-3");

  let loopCount = images.length - 1;
  while(loopCount >= 0) {
    const image = images[loopCount];
    const imgElement = document.createElement("img");
    imgElement.setAttribute("src", msg ? image.path : window.location.origin + image.path);
    imgElement.setAttribute("alt", image.originalname);
    imgElement.setAttribute("data-toggle", "imageGalleryModal");
    imgElement.setAttribute("data-category", "media")
    

    grid.appendChild(imgElement);
    loopCount--;
  }

  const messageContainer = messageContainerHTML({insertion: grid, type: "DOM"}, you, msg, index, array, reverse);

  if(reverse) {
    chatMessagesContainer.insertBefore(messageContainer, chatMessagesContainer.firstChild);
  } else {
    chatMessagesContainer.appendChild(messageContainer);
  }
}

function constructMediaMessage(categories, you = true) {
  for(let type of Object.keys(categories)) {
    console.log(type)
    const category = categories[type];


    switch (type) {
      case "file":
        createFileTypeMessages(category, you);
        break;
      case "video":
        createVideoTypeMessages(category, you);
        break;
      case "image":
        createImageGalleryMessage(category, you);
    }
    
  }
}



function addMsgPlacementClasses(elements) {
  const classRe = new RegExp('(topOne|middle|lastOne)');

  for(let i = 0; i <= elements.length - 1; i++) {
    const el = elements[i];
    // console.log(elements)
    const match = el.classList.value.match(classRe);
    if(match) {
      // Im returning for weird reasons
      el.classList.remove(match[0]);
    }
    
    el.querySelector(".sentBy-profilePic")?.remove();
    if(i === 0) {
      
      el.classList.add("lastOne")
      continue;
    }
    
    if(i === elements.length - 1) {
      el.classList.add("topOne")
      break;
    }

    el.classList.add("middle");
      
  }

}

function msgPlacement(messageContainer, elements = []) {
  const sender = messageContainer.dataset.sentBy;

  let prevEl = elements.length ? messageContainer.previousElementSibling : chatMessagesContainer.lastChild;

  if(!elements.length && messageContainer.nextElementSibling) {
    // this if is a slight tweak taking "delete" into account;
    prevEl = messageContainer.previousElementSibling;
  }

  if(!prevEl) {
    if(!elements.length) return;
    return addMsgPlacementClasses(elements)
  };

  const prevSender = prevEl.dataset.sentBy;
  if(prevSender === sender) {
    if(!elements.length) elements.push(messageContainer);
    if(prevEl !== messageContainer) {
      // this if is a slight tweak taking "delete" into account;
      // elements.length is 0, so it chooses "chatMessagesContainer.lastChild"
      // Which is the same element as the first message
      // cuz when I delete, I start from lastOne to topOne
      elements.push(prevEl)
    }

    return msgPlacement(prevEl, elements);
  }

  addMsgPlacementClasses(elements)
}

function emitNewMessage(chat, senderId) {
  if(connected) {
    socket.emit("newMessage", { chat, senderId })
  }
}

function getSeenCordinates(seenEl) {
  const rect = seenEl.getBoundingClientRect();
  console.log(rect);

  return rect
}

function getPreviousSeenFlags(arr, cb) {
  let targetMessages = [];
  if(chatState.messages.length) {
    if(arr.length) {
      const previousSeenMessages = chatState.messages.filter(m => m.seen.length && m._id !== chatState.chat.latestMessage._id);
      chatMessagesContainer.querySelectorAll(".messageStatus__status").forEach(el => el.remove())

      
      arr.forEach(userViewing => {
        const message = previousSeenMessages.find(m => m.seen.some(({user}) => user._id === userViewing))

        if(message) {
          const previousSeenEl = document.getElementById(message._id).querySelector(`.seenBy[data-user-id="${userViewing}"]`);
          if(previousSeenEl) {
            // update message, taking seen user Obj out
            message.seen = message.seen.filter(seenObj => seenObj.user._id !== userViewing);
            // return seenFlag cordinates
            targetMessages.push({userViewing, cordinates: getSeenCordinates(previousSeenEl), element: previousSeenEl})
          }
        }
        
      })
    }
  }

  cb && cb(targetMessages);
  return targetMessages;
}

function animateSeenFlags(previousSeenFlags) {
  console.log("PREVIOUS SEEN FLAGS YO", previousSeenFlags)
  const latestMessageEl = document.getElementById(chatState.chat.latestMessage._id)
  const latestMessageHeight = latestMessageEl.offsetHeight;
  
  previousSeenFlags.forEach(flag => {
    const {element, cordinates, userViewing} = flag;
    const {top: ltTop, left: ltLeft} = getSeenCordinates(latestMessageEl.querySelector(`.seenBy[data-user-id="${userViewing}"]`))
    element.style.zIndex = 10;
    element.style.position = "fixed"
    var tl = gsap.timeline({onComplete: () => element.remove()});
    // - 5 because the original .messageStatus has a bottom of -5px
    // and +1px left just because, I dont know
    tl.fromTo(element, {top: cordinates.top - latestMessageHeight, left: cordinates.left}, {top: ltTop - latestMessageHeight - 5, left: ltLeft + 1, duration: 0.3})
  })

  
}

const tweaks = () => {

  // a tweak to add messageOptions and id to media Messages after

  function replyCloudTweakToMediaMessages(iterations, replyingTo) {
    // the original messageContainer func creates a reply cloud only if there's a message to the database
    // so some tweaks need to be made
    console.log(chatState.messages[chatState.messages.length - 1], document.getElementById(chatState.messages[chatState.messages.length - 1]._id))
    let messageContainer = document.getElementById(chatState.messages[chatState.messages.length - 1]._id).nextElementSibling;
    
    for(let i = 0; i <= iterations - 1; i++) {
      // add a random 
      // create mock message resembling the upcoming message thats going to be uploaded
      const mockMessage = {isReplyTo: replyingTo, sentBy: {_id: userLoggedIn._id, firstName: userLoggedIn.firstName, lastName: userLoggedIn.lastName}};
      // create a reply cloud
      replyCloud(mockMessage, true, messageContainer);
      // but reply cloud will be added to the bottom, so we clone it and re-insert it before mainWrapper element
      const replyContainer = messageContainer.querySelector(".replyContainer");
      const mainWrapper = messageContainer.querySelector(".message-main-wrapper");
      messageContainer.insertBefore(replyContainer.cloneNode(true), mainWrapper);
      replyContainer.remove();
      messageContainer = messageContainer.nextElementSibling;
    }
  }

  function deleteMockMessageContainers(subIndex) {
    let curr = document.getElementById(chatState.messages[chatState.messages.length - (subIndex + 1)]._id).nextElementSibling;
    let next = null;
    for(let i = 0; i < subIndex; i++) {
      next = curr.nextElementSibling;
      curr.remove();
      curr = next;


      // clean up msgStatus
      if(i === subIndex - 1) {
        chatMessagesContainer.querySelectorAll(".messageStatus__status").forEach(el => {
          if(el.closest(".messageContainer") !== curr) {
            el.remove();
          }
        })
      }
    }
    
  }
  

  return { replyCloudTweakToMediaMessages, deleteMockMessageContainers }
}

async function submitMessage(e, messageText, mediaSelection) {
  e.preventDefault();
  let mediaResponse, textResponse, fileCategories;
  let { filesUploaded } = mediaSelection;
  const pathname = window.location.pathname.split("/");
  const id = pathname[pathname.length - 1];
  const replyingTo = chatState.replyingTo;


  if(messageText.trim().length) {
    try {
      textResponse = await axios.post(`/api/chats/send/${id}/text`, {text: messageText, chat: chatState.chat, replyTo: replyingTo._id, usersViewing: chatState.usersViewing});

      const message = textResponse.data.message;
      if(filesUploaded.length) {
        // since the media type messages will delete any seen tags of previous messages on the backend
        // and textResponse always come first
        // it will not be deleted
        message.seen = [];
      }
      chatState.messages.push(message);
      chatState.chat = textResponse.data.chat;

      createTextMessage(message, true)
      emitNewMessage(textResponse.data.chat, userLoggedIn._id)
      socket.emit("userStoppedTyping", {user: chatState.chat.nicknames[userLoggedIn._id] || userLoggedIn.firstName, chat: chatState.chat});
      userIsTyping = false;
    } catch(error) {
      console.log(error)
    }
  }

  if(filesUploaded.length) {
    fileCategories = filesUploaded.reduce((acc, file) => {
      return {...acc, [file.mediaType]: [...acc[file.mediaType] || [], file]}
    }, {})
    // This is the frontend part;
    // Media messages will be added to the DOM before they get uploaded to outside servers and added in the database
    // cuz it takes too much time and its bad for UX 
    constructMediaMessage(fileCategories)
    if(Object.entries(replyingTo).length) {
      const { replyCloudTweakToMediaMessages } = tweaks();
      replyCloudTweakToMediaMessages(filesUploaded.length, replyingTo)
    }
  }
  
  resetForm();
  // reset dropzone
  mediaSelection.reset();
  scrollToBottom(chatMessagesContainer);

  if(fileCategories) {
    let mediaRequests = [];
    const customId = !chatState.chat ? crypto.randomUUID().replaceAll("-", "").slice(0, 24) : null;
    for(let mediaType in fileCategories) {
      const mediaCategory = fileCategories[mediaType];
      let configData = {[`${mediaType}s`]: mediaCategory, chat: chatState.chat, customId, replyTo: replyingTo._id, usersViewing: chatState.usersViewing}
      
      mediaRequests.push(axios.post(`/api/chats/send/${id}/media/${mediaType}s`, configData))
    }


    try {
      mediaResponse = await Promise.all(mediaRequests);

      const msgArr = [];
      mediaResponse.forEach((response, i, arr) => {
        if(response.status === 201 && response.statusText === "Created") {
          // although Promise.all will reject all the promises if one of the many promises fail
          let messages = response.data.messages || response.data.message;
          if(!Array.isArray(messages)) {
            messages = Array.from([messages])
          }

          if(i === arr.length - 1) {
            chatState.chat = response.data.chat;
          }

          if(i !== arr.length - 1) {
            messages = messages.map(m => ({...m, seen: []}))
          }

          chatState.messages = [...chatState.messages, ...messages];
          msgArr.push(...messages);
        }
      })

       // right here, the mock type messages should be replaced with the real ones
      const {deleteMockMessageContainers} = tweaks();
      deleteMockMessageContainers(msgArr.length, false)
      constructMessages(msgArr)
      emitNewMessage(chatState.chat, userLoggedIn._id)
    } catch(error) {
      console.log(error);
    }
  }
  

  getPreviousSeenFlags(chatState.usersViewing, animateSeenFlags)
}

export function messageReceived({chat, senderId}) {
  if(chat._id !== chatState.chat._id) return;
  
  console.log("Do I even get received?")
  chatState.fetchMoreMessages.bottom = true;
  chatState.newMessage = true;
  const newUsersViewing = new Set([...chatState.usersViewing, senderId])
  chatState.usersViewing = [...newUsersViewing]
  chatState.chat = chat
  const distanceFromBottom = scrollDistanceFromBottom(chatMessagesContainer);
  if(distanceFromBottom > 100) {
    scrollBottom.classList.add("active");
  } else {
    console.log("SCROLLING DOWN")
    chatMessagesContainer.scrollTo(0, chatMessagesContainer.scrollTop - 1);
    chatMessagesContainer.scrollTo(0, chatMessagesContainer.scrollHeight);
  }
}

messageTextarea.addEventListener("keypress", (e) => {
  if(e.key === "Enter" || e.keyCode === 13 || e.which === 13 || e.code === "Enter") {
    const messageText = e.target.value
    submitMessage(e, messageText, mediaSelection);
  }
})

messageForm.addEventListener("submit", (e) => {
  const messageText = e.target.querySelector("textarea").value;
  // Reseting the form comes first because who knows how long it'll take for the server to respond
  submitMessage(e, messageText, mediaSelection);
})

chatMessagesContainer.addEventListener("scroll", _.throttle(e => {
  const activeTooltip = e.target.querySelector(".tooltip.show[following-tp]");
  if(activeTooltip) {
    const messageContainer = activeTooltip.closest(".messageContainer");
    setMessageTooltipPosition(messageContainer, activeTooltip, true);
  }
}, 1000))

chatMessagesContainer.addEventListener("mouseover", e => {
  if(e.target.getAttribute("following-tp") !== null) {
    e.target.classList.add("d-none")
  }
})


chatMessagesContainer.addEventListener("mouseout", e => {
  if(e.target.classList.contains("msg-options") || e.target.closest(".msg-options")) {
    const tp = e.target.closest(".messageContainer").querySelector(".mainContent .tooltip[following-tp]");
    tp && tp.classList.remove("d-none");
  }
})

const activeOption = {
  prev: null,
  current: null
}

function deActivateOption(option) {
  option.classList.remove("show")
  const tab = option.querySelector(".msg-options__option.show")
  const windowOption = option.querySelector(".option-window.show")
  tab && tab.classList.remove("show")
  windowOption && windowOption.classList.remove("show")
}

chatMessagesContainer.addEventListener("click", e => {
  if(e.target.classList.contains("msg-options__option") && !e.target.classList.contains(".reply")) {
    const msgOptions = e.target.closest(".msg-options")
    const tooltip = msgOptions.querySelector(".tooltip")
    tooltip && tooltip.classList.remove("show")
    const optionsWindow = e.target.querySelector(".option-window")

    // remove any other posts active msgOptions
    activeOption.prev = activeOption.current;
    activeOption.current = msgOptions;

    if(activeOption.prev !== activeOption.current && activeOption.prev !== null) {
      deActivateOption(activeOption.prev)
    }

    const optionWindows = msgOptions.querySelectorAll(".msg-options__option .option-window")
    optionWindows.forEach(window => {
      if(window !== optionsWindow) return window.classList.remove("show")
      
      if(window.classList.contains("show")) {
        window.classList.remove("show")
        msgOptions.classList.remove("show")
      } else {
        window.classList.add("show")
        msgOptions.classList.add("show")
      }
    })

    
  } else {
    if(activeOption.current) {
      deActivateOption(activeOption.current);
    }
  }
})

function updateMessageState(e, operation, messageId, newEmoji) {
  const message = chatState.messages.find(msg => msg._id === messageId);
  const reaction = message.reactions.length && message.reactions.find(reaction => reaction.user._id === userLoggedIn._id);
  const prevReaction = reaction?.emoji || null;

  const messageContainer = e.target.closest(".messageContainer") || document.getElementById(messageId);
  const mainContent = messageContainer.querySelector(".mainContent");

  function addNewReaction(message, reaction) {
    if(!reaction) {
      const userDetails = chatState.chat.users.find(u => u._id === userLoggedIn._id);
      return message.reactions.push({user: userDetails, emoji: newEmoji});
    }
    reaction.emoji = newEmoji;
  }

  function removeReaction(message, reaction) {
    if(!reaction) return;
    message.reactions = message.reactions.filter(reaction => reaction.user._id !== userLoggedIn._id)
  }

  function addNewReactionDOM(e, reactions) {
    let reactionsContainer = mainContent.querySelector(".reactionsDisplay")

    if(!reactionsContainer) {
      reactionsContainer = document.createElement("div");
      reactionsContainer.classList.add("reactionsDisplay");
      reactionsContainer.setAttribute("data-toggle", "tooltip");
      reactionsContainer.setAttribute("data-tooltip-type", "large");
      reactionsContainer.setAttribute("data-delay", "300");
      mainContent.appendChild(reactionsContainer);
    }
    reactionsContainer.setAttribute("data-title", reactions.map(({user}) => `${chatState.chat.nicknames[user._id] || user.firstName + " " + user.lastName} \n`).join(""));

    let reactionIcon = reactionsContainer.querySelector(`span[name="${e.target.dataset.emojiName}"]`);
    if(!reactionIcon) {
      reactionIcon = document.createElement("span");
      reactionIcon.setAttribute("name", e.target.dataset.emojiName); 
    }
    if(prevReaction) {
      if(!reactions.filter(r => r.emoji === prevReaction).length) {
        const reactionName = chatState.mainReactionEmoji[prevReaction];
        reactionsContainer.querySelector(`span[name="${reactionName}"]`).remove();
      }
      
    }
    reactionIcon.innerHTML = e.target.textContent;
    reactionsContainer.appendChild(reactionIcon);
    
    
    if(reactions.length > 1) {
      let reactionCount = reactionsContainer.querySelector("span.reactionCount");
      if(!reactionCount) {
        reactionCount = document.createElement("span");
        reactionCount.classList.add("reactionCount")
        reactionCount.textContent = reactions.length;
        reactionsContainer.appendChild(reactionCount);
      } else {
        const clone = reactionCount.cloneNode();
        clone.textContent = reactions.length;
        reactionCount.remove();
        reactionsContainer.appendChild(clone);
      }

    }
  }

  function removeReactionDOM(e, reactions) {
    if(!reactions.length) {
      return mainContent.querySelector(".reactionsDisplay").remove();
    }

    let reactionsContainer = mainContent.querySelector(".reactionsDisplay")
    const userLoggedInName = chatState.chat.nicknames[userLoggedIn._id] || userLoggedIn.firstName + " " + userLoggedIn.lastName;

    reactionsContainer.setAttribute("data-title", reactionsContainer.getAttribute("data-title").replace(`${userLoggedInName.trim()} \n`, ""));
    if(!reactions.filter(r => r.emoji === e.target.textContent || r.emoji === e.target?.querySelector(".emoji")?.textContent).length) {
      reactionsContainer.querySelector(`span[name="${e.target.dataset.emojiName || chatState.mainReactionEmoji[e.target?.querySelector(".emoji")?.textContent]}"]`).remove();
    }

    if(reactions.length > 1) {
      reactionsContainer.querySelector("span.reactionCount").textContent = reactions.length;
    } else {
      reactionsContainer.querySelector("span.reactionCount") && reactionsContainer.querySelector("span.reactionCount").remove();
    }
  
  }

  switch(operation) {
    case "addition":
      addNewReaction(message, reaction)
      addNewReactionDOM(e, message.reactions)
      break;
    case "subtraction":
      removeReaction(message, reaction)
      removeReactionDOM(e, message.reactions)
  }

}

chatMessagesContainer.addEventListener("click", async e => {
  if(e.target.classList.contains("reaction")) {
    deActivateOption(activeOption.current);
    console.log(e.target);
   
    const messageId = e.target.closest(".messageContainer").id;
    await axios.post(`/api/chats/reaction/${userLoggedIn._id}`, {emoji: e.target.textContent, messageId}).then(res => {
      const operation = res.data.operation;
      updateMessageState(e, operation, messageId, e.target.textContent);
      
    }).catch(error => {
      console.log(error);
    }) 
  }
})


function seenMouseLeave(e) {
  const details = e.target.querySelector(".seenBy__details");
  details.classList.remove("show")

  e.target.removeEventListener("mouseleave", seenMouseLeave);
}

chatMessagesContainer.addEventListener("mouseover", e => {
  if(e.target.classList.contains("seenBy")) {
    const r = e.target.getBoundingClientRect();
    const details = e.target.querySelector(".seenBy__details");
    const detailsWidth = details.offsetWidth;
    details.style.top = `${r.top - 30}px`
    details.style.left = `${r.left - (detailsWidth / 2)}px`
    details.style.position = "fixed"
    details.classList.add("show")

    e.target.addEventListener("mouseleave", seenMouseLeave);
  }
})


let reactionsData = {
  all: []
}

const reactionsList = (function reactionsList() {

  function setState(state) {
    return reactionsData = state;
  }

  function createReactionList(container, categoryName) {
    container.innerHTML = "";
    let html = "";

    reactionsData[categoryName].forEach(({user:{firstName, lastName, profilePic, _id: id}, emoji}) => {
      const isUser = id === userLoggedIn._id;
      const clickToRemove = isUser ? "<small class='muted'>Click to remove</small>" : "";
      const username = chatState.chat.nicknames[id] || `${firstName} ${lastName}`.trim();

      html += `<div class="userReaction isUser--${isUser}">
                  <img src="${profilePic}" alt="user image" class="profilePic" />
                  <p>${username} ${clickToRemove}</p>
                  <span class="emoji">${emoji}</span>
               </div>`
    })

    container.insertAdjacentHTML("beforeend", html)
  }

  return { createReactionList, setState}
})()

chatMessagesContainer.addEventListener("mouseup", e => {
  if(e.target.classList.contains("reactionsDisplay") || e.target.closest(".reactionsDisplay")) {
    const messageId = e.target.closest(".messageContainer").id;
    let {createReactionList, setState} = reactionsList;
    
    const reactionModal = document.getElementById("reactionsModal")
    openModal(reactionModal, () => reactionModal.setAttribute("data-msg-id", messageId));

  
    const reactionHeadersContainer = document.querySelector(".reactionListHeaders");
    reactionHeadersContainer.innerHTML = "";
    const message = chatState.messages.find(msg => msg._id === messageId);

    const reactionCategories = message.reactions.reduce((acc, r) => {
      const category = chatState.mainReactionEmoji[r.emoji]
      return {...acc, [category]: [...acc[category] || [], {user: r.user, emoji: r.emoji}]}
    }, {})

    setState({
      all: message.reactions,
      ...reactionCategories
    })

    for(let category in reactionsData) {
      let headerText = category !== "all" ? reactionsData[category][0].emoji : category.slice(0, 1).toUpperCase() + category.slice(1, category.length);
      let items = reactionsData[category].length;

      const li = document.createElement("li");
      li.setAttribute("data-category", category);
      if(category === "all") {
        li.classList.add("active");
        createReactionList(document.querySelector(".body__reactionsList"), category)
        li.textContent = headerText + " " + items;
      } else {
        li.innerHTML = `<p>${headerText}<span>${items}</span></p>`
      }

      reactionHeadersContainer.appendChild(li);
    }

  }
})

function setReactionListTab(e) {
  const targetTab = e.target.dataset.category;
  let {createReactionList} = reactionsList;

  createReactionList(document.querySelector(".body__reactionsList"), targetTab)
}

function selectActiveInlineTab(e, cb) {
  if(e.target.tagName === "LI") {
    e.target.parentNode.querySelector(".active")?.classList.remove("active")
    
    e.target.classList.add("active");

    cb && cb(...args);
  }
}

document.querySelector(".reactionListHeaders").addEventListener("click", e => selectActiveInlineTab(e, setReactionListTab(e)))

modalReactionsList.addEventListener("click", async e => {
  if(e.target.classList.contains("isUser--true")) {
    const messageId = e.currentTarget.closest("#reactionsModal").dataset.msgId;
    const reactionIcon = e.target.querySelector(".emoji").textContent;
    const reactionName = chatState.mainReactionEmoji[reactionIcon];
    const {setState} = reactionsList;

    await axios.post(`/api/chats/reaction/${userLoggedIn._id}`, {emoji: reactionIcon, messageId}).then(res => {
      const operation = res.data.operation;
      updateMessageState(e, operation, messageId, reactionIcon);
      const message = chatState.messages.find(msg => msg._id === messageId);

      setState({
        ...reactionsData,
        all: message.reactions,
        [reactionName]: reactionsData[reactionName].filter(r => r.user._id !== userLoggedIn._id)
      })

      const reactionHeaders = modalReactionsList.previousElementSibling.querySelectorAll("li");

      reactionHeaders.forEach(header => {
        
        const categoryTitle = header.dataset.category;
        const categoryLength = reactionsData[categoryTitle]?.length;
        if(!categoryLength) {
          if(categoryTitle !== "all") return header.remove();
          header.textContent = "All";
          return header.classList.remove("active");
        }
        

        if(categoryTitle === "all") {
          header.textContent = `All ${message.reactions.length}`;
        } else {
          const count = header.querySelector("p > span");
          count.textContent = categoryLength;
        }
      })
      
      e.target.remove();
    }).catch(error => {
      console.log(error);
    }) 
  }
})

const deleteMessageUtils = (() => {
  function recurse(currIndex, elements = [], reverse = false) {
    let searchIndex = reverse ? currIndex - 1 : currIndex + 1;
    if(chatState.messages[currIndex]?.sentBy?._id === chatState.messages[searchIndex]?.sentBy?._id && chatState.messages[searchIndex]?.messageType !== "delete") {
     
      elements.push(reverse ? document.getElementById(chatState.messages[currIndex]._id).previousElementSibling : document.getElementById(chatState.messages[currIndex]._id).nextElementSibling)
      currIndex = searchIndex;
      return recurse(currIndex, elements, reverse);
    }

    return elements;
  }

  function positionElements(els, you, sentBy, reverse) {
    const elements = reverse ? els.reverse() : els;

    elements.forEach((el, i, arr) => {
      const classRe = new RegExp('(topOne|middle|lastOne)');
      const match = el.classList.value.match(classRe);
      if(match) {
        el.classList.remove(match[0]);
      }
      
      el.querySelector(".message-main-wrapper .sentBy-heading")?.remove();
      el.querySelector(".message-main-wrapper .sentBy-profilePic")?.remove();
      if(arr.length == 1) {
        if(!you) {
          addSenderName(sentBy, el.querySelector(".message-main-wrapper"))
          addSenderProfilePic(sentBy, el.querySelector(".message-main-wrapper"))
        }
        return;
      } else if(i == 0) {
        if(!you) {
          addSenderName(sentBy, el.querySelector(".message-main-wrapper"))
        }
        el.classList.add("topOne")
      } else if(i === arr.length - 1) {

        if(!you) {
          addSenderProfilePic(sentBy, el.querySelector(".message-main-wrapper"))
        }
        el.classList.add("lastOne")

      } else {
        el.classList.add("middle")
      }
    })



  }

  const getUpAndDownMessages = (deletedMessageIndex) => {
    const sentBy = chatState.messages[deletedMessageIndex].sentBy;
    const you = sentBy._id === userLoggedIn._id;

    const downMessages = recurse(deletedMessageIndex, [])
    const upMessages = recurse(deletedMessageIndex, [], true)

    positionElements(upMessages, you, sentBy, true)
    positionElements(downMessages, you, sentBy, false)
  }

  const deleteMessageFrontEnd = (deletedMessageIndex) => {
    const downMessages = recurse(deletedMessageIndex, [])
    const upMessages = recurse(deletedMessageIndex, [], true)
    const all = [...upMessages.reverse(), ...downMessages];

    const sentBy = chatState.messages[deletedMessageIndex].sentBy;
    const you = sentBy._id === userLoggedIn._id;

    const removedElement = document.getElementById(chatState.messages[deletedMessageIndex]._id);
    const removedElementHadMarginAuto = removedElement.classList.contains("mt-auto");
    removedElement.remove()
    chatState.messages.splice(deletedMessageIndex, 1);

    if(!all.length) return;

    
    positionElements(all, you, sentBy)
    if(removedElementHadMarginAuto) {
      all[0].classList.add("mt-auto")
    }
  }

  return { getUpAndDownMessages, deleteMessageFrontEnd }
})()

chatMessagesContainer.addEventListener("click", async e => {
  if(e.target.getAttribute("data-delete")) {
    const messageContainer = e.target.closest(".messageContainer")
    const messageId = messageContainer.id;
    const deleteOption = e.target.dataset.delete;
    
    try {
      const currMessageIndex = chatState.messages.findIndex(m => m._id === messageId);

      // In case you're hiding it, you'll have to know if it was the last one right?

      if(deleteOption == "you") {
        await axios.put(`/api/chats/hide/${messageId}`);

        const { deleteMessageFrontEnd } = deleteMessageUtils;
        deleteMessageFrontEnd(currMessageIndex)
      } else {
        
        const { data: {unsentMessage} } = await axios.put(`/api/chats/delete/${messageId}`, { chat: chatState.chat, sentBy: chatState.messages[currMessageIndex].sentBy._id })

        const isLastMessage = chatState.chat.latestMessage._id === chatState.messages[currMessageIndex]._id;
        if(isLastMessage) chatState.chat.latestMessage = unsentMessage;
        chatState.messages[currMessageIndex] = unsentMessage;
        
        if(currMessageIndex === chatState.messages.length - 1) {
          emitNewMessage(chatState.chat, unsentMessage.sentBy._id)
        }

        const isYou = unsentMessage.sentBy._id === userLoggedIn._id;
        const unsentMessageContainer = deleteMessageMarkup(unsentMessage, isYou);
        const oldMessage = document.getElementById(messageId);
        const oldMessageHadMarginAutoClass = oldMessage.classList.contains("mt-auto");
        if(oldMessageHadMarginAutoClass) unsentMessageContainer.classList.add("mt-auto");
        oldMessage.replaceWith(unsentMessageContainer)

        const { getUpAndDownMessages } = deleteMessageUtils;
        getUpAndDownMessages(currMessageIndex);
      }

      
    } catch(error) {
      console.log(error);
    }
  }
})

chatMessagesContainer.addEventListener("click", e => {
  if(e.target.classList.contains("reply")) {
    const replyToMessage = chatState.messages.find(m => m._id === e.target.closest(".messageContainer").id);
    createReplyFlag(replyToMessage)
  }
})

replyingTo.addEventListener("click", e => {
  if(e.target.tagName === "BUTTON") {
    resetReplyingTo(e.currentTarget);
  }
})

chatMessagesContainer.addEventListener("scroll", _.throttle(async e => {

  if(e.target.scrollTop === 0 || e.target.scrollTop === e.target.scrollHeight - e.target.offsetHeight || e.target.scrollTop + 1 === e.target.scrollHeight - e.target.offsetHeight) {
    let direction = e.target.scrollTop === 0 ? "top" : "bottom";


    if(chatState.fetchMoreMessages[direction] && chatState.messages.length) {
      let latestMessageDate;
      let heightBefore = e.target.scrollHeight;

      if(direction === "top") {
        latestMessageDate = chatState.messages[0].createdAt;
      } else {
        latestMessageDate = chatState.messages[chatState.messages.length - 1].createdAt;
      }

      const response = await axios.get(`/api/chats/fetch/${chatState.chat._id}`, {params: {latestMessageDate, direction}})
      chatState.fetchMoreMessages[direction] = response.data.fetchMoreMessages;

      if(direction === "top") {
        chatState.fetchMoreMessages.bottom = true;
        chatState.messages = [...response.data.messages.reverse(), ...chatState.messages];
        constructMessages(response.data.messages.slice().reverse(), true);

        const elementBeforeNewBatch = document.getElementById(chatState.messages[chatState.messages.findIndex(m => m._id === response.data.messages[response.data.messages.length - 1]._id) + 1]._id)
        if(elementBeforeNewBatch) {
          elementBeforeNewBatch.classList.remove("mt-auto")
        }
        if(!chatState.fetchMoreMessages.top) {
          return await createChatHeader(chatState.chat, chatMessagesContainer)
        } else {
          e.target.scrollTo(0, e.target.scrollHeight - heightBefore - 40);
        }

      } else {
        // direction = bottom
        scrollBottom.classList.remove("active");
        chatState.messages = [...chatState.messages, ...response.data.messages.reverse()];
        // console.log(chatState.chat.latestMessage._id, chatState.messages.map(m => m._id))
        constructMessages(response.data.messages);
        if(chatState.newMessage) {
          console.log("If goes")
          chatState.chat.latestMessage = chatState.messages[chatState.messages.length -1]
          getPreviousSeenFlags(chatState.chat.latestMessage.seen.map(so => so.user._id), animateSeenFlags)
          e.target.scrollTo(0, chatMessagesContainer.scrollHeight)
          chatState.newMessage = false;
        } else {
          console.log("else goes")
          e.target.scrollTo(0, heightBefore - chatMessagesContainer.offsetHeight)
        }
        
        
      }
    }
  }
}, 1000))


const scrollDistanceFromBottom = (target) => {
  return target.scrollHeight - (target.scrollTop + target.offsetHeight)
}

chatMessagesContainer.addEventListener("scroll", _.throttle(e => {
  const latestMessageElementInView = document.getElementById(chatState.chat.latestMessage._id)

  if(latestMessageElementInView) {
    const distanceFromBottom = scrollDistanceFromBottom(e.target);
    if(distanceFromBottom > 200) {
      scrollBottom.classList.add("active");
    } else {
      scrollBottom.classList.remove("active");
    }
  }
}, 500))


const activeUserOptions = {
  prev: null,
  current: null
}

chatInformationContainer.addEventListener("click", e => {
  if(e.target.classList.contains("accordion__user__optionsContainer__optionsBtn")) {
    const options = e.target.nextElementSibling;
    activeUserOptions.prev = activeUserOptions.current;
    activeUserOptions.prev?.classList.remove("show");

    
    activeUserOptions.current = options;
    if(activeUserOptions.current === activeUserOptions.prev) {
      activeUserOptions.current.classList.remove("show")
      activeUserOptions.current = null;
    } else {
      activeUserOptions.current.classList.add("show")
    }
    
    
  } else {
    activeUserOptions.current?.classList.remove("show")
    activeUserOptions.current = null;
  }
})

async function changeAdminStatus(optionPressed, userId, operation) {
  console.log("OPERATION", operation)
  try {
    await axios.put(`/api/chats/admin/${userId}`, {chatId: chatState.chat._id, operation});

    let action, text, classReplace = ["make-admin", "remove-admin"];
    if(operation === "add") {
      action = "removeAdmin"
      text = "Remove admin";
      const userDetails = optionPressed.closest(".accordion__user").querySelector(".accordion__user__userDetails");
      const span = document.createElement("span");
      span.classList.add("muted");
      span.textContent = "Admin";
      userDetails.appendChild(span);
      chatState.chat.admin.push(userId);
    } else {
      action = "makeAdmin"
      text = "Make admin"
      classReplace.reverse()
      optionPressed.closest(".accordion__user").querySelector(".accordion__user__userDetails span")?.remove();

      const exAdminIndex = chatState.chat.admin.indexOf(userId);
      chatState.chat.admin.splice(exAdminIndex, 1)
    }

    console.log(chatState.chat.admin)
    optionPressed.querySelector("span").textContent = text
    optionPressed.classList.replace(classReplace[0], classReplace[1])
    optionPressed.setAttribute("data-action", action);

  } catch(error) {
    console.log(error);
  }
}

async function removeMember(e, userId) {

    const response = await axios.put(`/api/chats/removeUser`, {chat: chatState.chat, user: chatState.chat.users.find(u => u._id === userId)});

    chatState.chat = response.data.updatedChat;
    
    if(userId === userLoggedIn._id) {
      return window.location.href = "/messages"
    }


    if(!chatState.chat.customName) {
      const chatHeaders = document.querySelectorAll(".chatHeader h3");
      chatHeaders.forEach(header => header.textContent = chatState.chat.chatName)
      document.querySelector(".pageTitle span").textContent = chatState.chat.chatName;
    }

    if(!chatState.chat.chatImage) {
      if(chatState.chat.users.length < 16) {
        const chatPictureContainers = document.querySelectorAll(".chatPictureContainer");
        chatPictureContainers.forEach(container => createSideToSidePictures(container, chatState.chat));
      }
    }

    
    const targetAccordion = document.querySelector(".accordion__chatMembers");
    const removedUserTab = e.target.closest(".accordion__user");
    const removedUserTabHeight = removedUserTab.offsetHeight;

    removedUserTab.remove()
    targetAccordion.style.height = `${targetAccordion.offsetHeight - removedUserTabHeight}px`;

}

chatInformationContainer.addEventListener("click", async e => {
  if(e.target.classList.contains("accordion__user__optionsContainer__list__list-item")) {
    const action = e.target.dataset.action;
    const userId = e.target.closest(".accordion__user__optionsContainer").dataset.userId;

    console.log(action)
    switch (action) {
      case "makeAdmin":
        await changeAdminStatus(e.target, userId, "add");
        break;
      case "removeAdmin":
        await changeAdminStatus(e.target, userId, "remove");
        break;
      case "removeChatUser":
      case "leaveChat":
        await removeMember(e, userId)
    }
  }
})

function createFilePreviewAndDownload(selectedFile, contentContainer) {

  elements.imageGalleryModal.classList.add("fairlyBlack")
  const filename = document.createElement("p");
  filename.textContent = selectedFile.originalname;
  filename.classList.add("galleryContent__filename");
  const desc = document.createElement("p");
  desc.classList.add("no-preview-available")
  desc.textContent = "No preview available";
  
  [filename, desc, downloadLink(selectedFile)].forEach(el => contentContainer.appendChild(el))
}


document.addEventListener("click", async e => {
  if(e.target.dataset.toggle === "imageGalleryModal") {
    const category = e.target.dataset.category;
    console.log("yeah")
    
    if(!chatState[category].length) {
      const { fetchMedia, fetchFiles } = mediaAndFilesUtilities();
      if(category === "media") {
        await fetchMedia();
      } else {
        await fetchFiles();
      }
    }

    const activeItem = chatState[category].find(item => item.id === e.target.id || item.path === e.target.src || item.path === e.target.dataset.videopath || item.filename === e.target.dataset.filename);
    if(category === "media" && activeItem.mediaType === "video") {
      e.target.previousElementSibling && e.target.previousElementSibling.tagName.toLowerCase() === "video" && e.target.previousElementSibling.pause();
    }

    const activeItemIndex = chatState[category].indexOf(activeItem);
    console.log("ActiveItemindex", activeItemIndex) 
    openModal(elements.imageGalleryModal, () => {
      // so that all the load of event listeners from the class are removed
      elements.imageGalleryModal.querySelector(".gallery").replaceWith(elements.imageGalleryModal.querySelector(".gallery").cloneNode(true))

      if(category === "media") {
        elements.imageGalleryModal.classList.remove("fairlyBlack")
        new Gallery(elements.imageGalleryModal.querySelector(".gallery"), chatState[category], activeItemIndex)
      } else {
        elements.imageGalleryModal.querySelector(".gallery .galleryItems")?.remove();
        createFilePreviewAndDownload(activeItem, elements.imageGalleryModal.querySelector(".galleryContent"));
      }
      
    })
  }
})

async function fetchSearchedMessages(messageId, topMessage) {
  const queryParams = {params: {chatId: chatState.chat._id}};
  if(topMessage) {
    queryParams.params.topMessage = topMessage;
  }

  const { data: {newMessages} } = await axios.get(`/api/chats/searchMessageById/${messageId}`, queryParams)

  
  chatState.messages = newMessages.reverse();
  chatMessagesContainer.innerHTML = "";
  constructMessages(chatState.messages);
  chatMessagesContainer.scrollTop = 1;
}

chatMessagesContainer.addEventListener("click", async e => {
  if(chatState.loading) return;

  if(e.target.classList.contains("replyCloud")) {
    document.querySelector(".mainContent.outline")?.classList.remove("outline")
    const messageId = e.target.href.split("#")[1];
    const targetMessageEl = document.getElementById(messageId);

    if(targetMessageEl) {
      targetMessageEl.querySelector(".mainContent").classList.add("outline")
      targetMessageEl.parentElement.scrollTo(0, targetMessageEl.offsetTop + 1)
    } else {
      try {
        chatState.loading = true;

        await fetchSearchedMessages(messageId, chatState.messages[0]);

        document.getElementById(messageId).querySelector(".mainContent").classList.add("outline")
      } catch(error) {
        console.log(error);
      } finally {
        chatState.loading = false;
      }
    }
  } else {
    document.querySelector(".mainContent.outline")?.classList.remove("outline")
  }
})




chatViewContainer.addEventListener("click", e => {
  if(e.target.dataset.action === "search") {
    hideChatDetails();
    searchConvoForm.classList.add("active");
    setTimeout(() => {
      searchConvoForm.querySelector("input").focus();
    }, 10)
  }
})


function searchConvoUlilities(searchResults, searchKeywords) {
  const resultsDisplay = searchConvoForm.querySelector(".searchInConvo__inputGroup span");
  const input = searchConvoForm.querySelector(".searchInConvo__inputGroup input");
  const controlBtns = searchConvoForm.querySelectorAll(".searchInConvo__controls button");
  function setElementsInitial() {
    function results() {
      resultsDisplay.classList.remove("d-none");
      resultsDisplay.textContent = `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`;
    }

    function controlButtonsInitial() {
      if(searchResults.length > 1) {
        controlBtns[0].disabled = false;
      }
    }

    results();
    controlButtonsInitial();
  }

  function toggleDisabledButtons(disabled, index) {
    if(disabled) {
      return controlBtns.forEach(btn => btn.disabled = disabled);
    }

    controlBtns[0].disabled = index + 1 <= searchResults.length - 1 ? disabled : true;
    controlBtns[1].disabled = index - 1 >= 0 ? disabled : true;
  }

  function setButtonIndexes(index) {
    controlBtns[0].setAttribute("goTo", index + 1)
    controlBtns[1].setAttribute("goTo", index - 1)
  }

  function resetPreviousMark() {
    const existingMark = document.querySelector(".mark");
    if(existingMark) {
      const messageId = existingMark.closest(".messageContainer").id;
      const textEl = existingMark.closest("p");
      existingMark.remove();
      textEl.textContent = chatState.messages.find(m => m._id === messageId).text;
    }
  }

  function mark(el, index) {
    resetPreviousMark();
    el.parentElement.scrollTo(0, el.offsetTop + 1);
    const textEl = el.querySelector(".mainContent p");
    
    const regEx = new RegExp(searchKeywords, "ig");
    textEl.innerHTML = textEl.textContent.replace(regEx, `<span class="mark">$&</span>`)
    toggleDisabledButtons(false, index);
    setButtonIndexes(index);
  }

  async function markSearchedWords(index) {
    console.log("index", index)
    const searchResult = searchResults[index];
    chatState.fetchMoreMessages.bottom = true;

    const el = document.getElementById(searchResult._id);
    if(!el) {
      toggleDisabledButtons(true);
      try {
        await fetchSearchedMessages(searchResult._id);
        scrollBottom.classList.add("active");
      } catch(err) {
        console.log(err);
      } finally {
        
        return await markSearchedWords(index);
      }
    }

    mark(el, index);
  }

  return {setElementsInitial, markSearchedWords}
}

searchConvoForm.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(e.target);
  chatState.searchKeywords = formData.get("convoKeywords");
  const {data: {searchedMessages}} = await axios.get(`/api/chats/searchMessagesByKeyword/${chatState.searchKeywords}`, {params: {chatId: chatState.chat._id}})
  chatState.searchedMessages = searchedMessages;
  const { setElementsInitial, markSearchedWords } = searchConvoUlilities(searchedMessages, chatState.searchKeywords);

  setElementsInitial();

  if(searchedMessages.length) {
    await markSearchedWords(0)
  }
})

searchConvoForm.querySelector(".searchInConvo__controls").addEventListener("click", e => {
  if(e.target.tagName === "BUTTON" && !e.target.disabled) {
    const { markSearchedWords } = searchConvoUlilities(chatState.searchedMessages, chatState.searchKeywords)
    const goTo = parseInt(e.target.getAttribute("goTo"))
    markSearchedWords(goTo)
  }
})

async function fetchLatestMessages() {
  const response = await axios.get(`/api/chats/fetch/${chatState.chat._id}`, {params: {latestMessageDate: new Date(), direction: "top"}})
  chatMessagesContainer.innerHTML = "";
  chatState.messages = response.data.messages.reverse();
  constructMessages(response.data.messages);
  chatMessagesContainer.scrollTo(0, chatMessagesContainer.scrollHeight)
}

searchConvoForm.querySelector(".searchInConvo__close").addEventListener("click", async e => {

  // hide the input stuff (DOM)
  searchConvoForm.classList.remove("active");
  searchConvoForm.querySelector(".searchInConvo__inputGroup span").textContent = "";
  searchConvoForm.querySelector(".searchInConvo__inputGroup span").classList.add("d-none");
  searchConvoForm.querySelectorAll(".searchInConvo__controls").forEach(btn => {
    btn.removeAttribute("goTo");
    btn.disabled = true;
  });
  document.getElementById("searchConvo").value = "";

  // reset search state
  chatState.searchedMessages = []
  // fetch last messages
  await fetchLatestMessages();
})

async function scrollToLatestMessages(e) {
  e.target.classList.remove("active");
  const latestMessageElementInView = document.getElementById(chatState.chat.latestMessage._id);

  if(latestMessageElementInView) {
    return chatMessagesContainer.scrollTo(0, chatMessagesContainer.scrollHeight);
  }

  await fetchLatestMessages();
  
}

scrollBottom.addEventListener("click", scrollToLatestMessages)

window.addEventListener('beforeunload', deleteUserTempFiles);





