import { svgIcons, elements, createPostHtml, elementContains, followUserActions, AppState, updateProfileTabs } from "./common.js";
import {openModal} from "./modal.js"


function newCountSpan() {
  const newCount = document.createElement('span');
  return newCount;
}

function determineAdding(btnBlock, newVal) {
  const currentValue = btnBlock.querySelector("span.initial").textContent;
  return currentValue < newVal;
}

function toggleSVG(btnBlock, newVal) {
  let adding = determineAdding(btnBlock, newVal);
  const btnIcon = btnBlock.querySelector('.btn-icon');

  const currSvg = btnBlock.querySelector('svg');
  const newSvg = adding
    ? svgIcons.likeActive
    : svgIcons.likeMuted;

  currSvg.remove();
  btnIcon.insertAdjacentHTML('beforeend', newSvg);
  btnIcon.querySelector('.ball').classList.toggle('active');
}

function toggleTooltip(btnBlock, newVal, text1, text2) {
  let adding = determineAdding(btnBlock, newVal);
  const tooltip = btnBlock.querySelector('.tooltip');
  btnBlock.setAttribute("data-title", adding ? text1 : text2)
  tooltip.textContent = btnBlock.getAttribute("data-title");
  tooltip.classList.remove("show")
}


export function toggleActive(btnBlock, newVal) {
  let adding = determineAdding(btnBlock, newVal);
  if(adding && parseInt(newVal) - 1 == 0) {
    btnBlock.querySelector(".count").classList.remove("hide");
  }
  adding ? btnBlock.classList.add("active") : btnBlock.classList.remove("active");
}



export function countOperations(btnBlock, newVal) {
  const countContainer = btnBlock.querySelector('.count');
  const currentCount = countContainer.querySelectorAll('.initial');

  const newCount = newCountSpan();
  countContainer.appendChild(newCount);
  newCount.textContent = newVal;
  newCount.classList.add('inserted');

  let adding = determineAdding(btnBlock, newVal);

  currentCount[0].style.animation = `${adding ? "remove" : "removeDownwards"} 0.2s ease forwards`;
  newCount.style.animation = `${adding ? "insert" : "insertDownwards"} 0.2s ease forwards`;

  currentCount[0].addEventListener('animationend', () => {
    newCount.classList.remove('inserted');
    newCount.classList.add("initial");
    currentCount.forEach(count => count.remove());
    btnBlock.setAttribute("data-firstclick", "true");
  });
}

function defineButtonType(btnBlock) {
  return btnBlock.classList.value
    .split(' ')
    .filter(
      className =>
        className == 'like' || className == 'share' || className == 'reply'
    );
}

const getPostId = element => {
  return element.closest(".postContainer").getAttribute("data-post-id");
}

function openDeleteModal(e) {
  if (e.target.classList.contains("delete")) {
    openModal(elements.deleteModal)
    const postId = e.target.closest(".postContainer").getAttribute("data-post-id");
    elements.deleteModal.querySelector("button.danger").setAttribute("data-post-id", postId);
  }
}

function openReplyModal(postId) {
  openModal(elements.replyModal);
  elements.replyModal.querySelector("#reply").setAttribute("data-replyId", postId)
}



// Post Block Actions ** reply/share/like **
var allowLikeOperation = null;

window.addEventListener('click', async (e) => {
  if (
    e.target.classList.contains("btn-block")
  ) {
    const btnBlock = e.target;
    const buttonType = defineButtonType(btnBlock);
    const postId = getPostId(btnBlock);
    

    if (buttonType == 'like') {
      clearTimeout(allowLikeOperation);
      let timeout = btnBlock.getAttribute("data-firstclick") === "true" ? 0 : 210;

      allowLikeOperation = setTimeout(() => {
        axios.put(`/api/posts/${postId}/like`).then(res => {
          if(window.location.href.includes("profile")) {
            updateProfileTabs({likes: res.data.likes}, ["posts", "shares-replies", "likes"], postId);
            AppState.fetch = true;
          }
          toggleActive(btnBlock, res.data.likes.length);
          toggleSVG(btnBlock, res.data.likes.length);
          toggleTooltip(btnBlock, res.data.likes.length, "Unlike", "Like");
          countOperations(btnBlock, res.data.likes.length);
        })
      }, timeout);
      btnBlock.setAttribute("data-firstclick", "false");
      return;
    }

    if (buttonType == "share") {
      axios.post(`/api/posts/${postId}/share`).then(res => {
        updateProfileTabs({ shareUsers: res.data.shareUsers }, ["posts", "shares-replies", "likes"], postId);
        AppState.fetch = true;
        toggleActive(btnBlock, res.data.shareUsers.length);
        toggleTooltip(btnBlock, res.data.shareUsers.length, "Undo share", "Share")
        countOperations(btnBlock, res.data.shareUsers.length);
      })
      return;
    }

    if (buttonType == "reply") {
      axios.get(`/api/posts/${postId}`).then(res => {
        const originalPostContainer = elements.replyModal.querySelector(".original-post");
        originalPostContainer.innerHTML = "";
        const originalPost = createPostHtml(res.data.postData, false, true)
        originalPostContainer.insertAdjacentHTML("afterbegin", originalPost)
        openReplyModal(res.data.postData._id);
      })
      return;
    }
  }
});

let currentSettingsTab = null;

window.addEventListener("click", e => {
  if (e.target.classList.contains("more")) {
    if (currentSettingsTab) {
      currentSettingsTab.classList.remove("show")
      currentSettingsTab.style.height = "0"
    }
    const settingsTab = e.target.nextElementSibling;
    currentSettingsTab = settingsTab;
    settingsTab.classList.add("show")
    const listItems = settingsTab.querySelectorAll("li");
    settingsTab.style.height = `${listItems[0].offsetHeight * listItems.length}px`
  } else if (currentSettingsTab && !e.target.classList.contains("more") && !elementContains(currentSettingsTab, e.target)) {
    currentSettingsTab.classList.contains("show") && currentSettingsTab.classList.remove("show")
    currentSettingsTab.style.height = "0"
  }
})

// posts dont exists until they're loaded by the request, so you cant add Event Listener to them


elements.postsContainer.addEventListener("click", openDeleteModal)

elements.postsContainer.addEventListener("click", async e => followUserActions.call(e.target.closest(".userDetails-window"), e))

elements.postsContainer.addEventListener("click", e => {
  if(e.target.closest(".post-details")) {
    const postContainer = e.target.closest(".postContainer")
    const postId = postContainer.getAttribute("data-post-id");
    const selection = window.getSelection();
    const thereIsSelectedText = selection?.focusNode?.parentElement.closest(".postContainer") === postContainer && (selection.type === "Range" && !selection.isCollapsed);
    
      if (postId
      && !e.target.classList.contains("btn-block")
      && !e.target.classList.contains("btn-icon")
      && !e.target.classList.contains("settings-list-item")
      && !e.target.classList.contains(".postContainer")
      && !e.target.classList.contains(".followButton")
      && !thereIsSelectedText
      && !e.target.closest(".dontView")
      ) {
      window.location.href = "/posts/" + postId;
    }
  }
})

function showOrHideOverlay(e) {
  const hideOverlay = e.target.classList.contains("overlay__info__action");
  const showOverlay = e.target.classList.contains("hide-overlay");

  if(showOverlay) {
    return e.target.parentElement.querySelector(".overlay").classList.remove("d-none");
  }

  if(hideOverlay) {
    e.target.closest(".overlay").classList.add("d-none");
  }
}

elements.postsContainer.addEventListener("click", showOrHideOverlay)

const getPinnedElements = (pinId) => {
  const container = document.querySelector(`[data-post-id="${pinId}"]`);
  const text = container.querySelector(".settings-list-item.pin span");
  const label = container.querySelector(".additional-post-info");
  const postDetails = container.querySelector(".post-details");
  const postContent = postDetails.querySelector(".post-content");
  

  return {container, text, label, postDetails, postContent}
  
}




function goTo(el, from, to) {
  gsap.fromTo(el, {top: from}, { top: to, duration: 1, ease: 'Power3.easeOut' })
}

function reOrderElements(id, isPinned) {
  const sortedByDate = AppState.posts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if(isPinned) {
    const sliceOne = sortedByDate.filter(pin => pin._id !== id)
    const currentPin = AppState.posts.find(pin => pin._id == id)
    const newArr = [currentPin].concat(sliceOne);
    AppState.posts = newArr;
  } else {
    AppState.posts = sortedByDate
  }
}


function calculateOffset(el, oldPin, newPin) {
  // cuz offsetTop not working as expected
  // probably because when the animation ends their top is set to 0
  const allEls = document.querySelectorAll(".postContainer");
  let index = Array.from(allEls).indexOf(el);
  if(index == 0) index = 1;
  // let add = oldPin || oldPin !== newPin ? 1 : 0;
  return index * el.offsetHeight;
}

function pinToTop(oldPinId, newPin) {
  const condition = (window.location.href.includes("profile") && ((userLoggedIn._id == profileUserId)) && window.location.hash === "#posts");

  console.log(condition, "conditioner")
  console.log(window.location.href.includes("profile"), window.location.hash === "#posts", window.location.hash)
  
  if(condition) {
    const postsContainer = document.querySelector(".postsContainer");
    const {container} = getPinnedElements(newPin._id);
    const height = container.offsetHeight;

    if(window.scrollY > window.innerHeight) {
      window.scrollTo(0, 0)
    }
    
    setTimeout(() => reOrderElements(newPin._id, newPin.pinned), 751)

    if(oldPinId && oldPinId !== newPin._id) {
      const {container: oldPinContainer} = getPinnedElements(oldPinId);
      oldPinContainer.classList.remove("abs");
    }

    
    if(newPin.pinned) {
      const currentPosition = calculateOffset(container);
      if(currentPosition > 0) {
        // animate it
        gsap.fromTo(postsContainer, {paddingTop: 0}, { paddingTop: `${height}px`, duration: 0.5, delay: 0.25 })

        container.classList.add("abs")
        goTo(container, currentPosition, 0);
      } 
      // or do nothing concerning animations since its already at the top
    } else {
      postsContainer.style.paddingTop = 0;
      container.classList.remove("abs");
    }
      
   
  }
}

function changePinText(e, oldPinId, newPin) {
  const settingsTab = e.target.closest(".settings-tab");
  settingsTab.classList.remove("show")

  const settingsText = e.target.querySelector("span");

  if(oldPinId !== null && oldPinId !== newPin._id && document.getElementById(oldPinId)) {
    // if old is not null, which it IS the first time, as well as not the same post
    const {text: oldPinText} = getPinnedElements(oldPinId);
    oldPinText.textContent = "Pin to your profile";
    settingsText.textContent = "Unpin from profile"
    return;
  }


  let isPinned = newPin.pinned;
  settingsText.textContent = isPinned ? "Unpin from profile" : "Pin to your profile";
}

function addPinLabel(oldPin, newPin) {
  let pinned = newPin.pinned;
  const { container, label, postContent, postDetails } = getPinnedElements(newPin._id)
  let labelContainer = label || null;

  if(oldPin && oldPin !== newPin._id && document.getElementById(oldPin)) {
    const {label: oldPinLabel, postContent: oldPinPostContent} = getPinnedElements(oldPin);
    oldPinLabel.remove();
    oldPinPostContent.classList.remove("pt-none")
  }

  if(pinned) {
    labelContainer = document.createElement("div");
    labelContainer.classList.add("additional-post-info");
    labelContainer.insertAdjacentHTML("beforeend", 
    `<p class="pinned-post">
        <span class="svg-wrapper"><i class="fa-solid fa-thumbtack"></i></span>
        <span>Pinned post</span>
      </p>`)
    postDetails.prepend(labelContainer);
    postContent.classList.add("pt-none")
  } else {
    labelContainer.remove();
    postContent.classList.remove("pt-none") 
  }
}

elements.postsContainer.addEventListener("click", async e => {
  if(e.target.classList.contains("pin")) {
    const postId = getPostId(e.target);

    try {
      const {data: {oldPinId, newPin}} = await axios.put(`/api/posts/${postId}/pin`);
      AppState.fetch = true;
      // Some crazy amount of loops here, need to install redis...
      updateProfileTabs({ pinned: newPin.pinned }, ["posts", "shares-replies", "likes"], newPin._id);
      if(oldPinId) {
        updateProfileTabs({ pinned: false }, ["posts", "shares-replies", "likes"], oldPinId);
      }

      changePinText(e, oldPinId, newPin);
      addPinLabel(oldPinId, newPin);     
      pinToTop(oldPinId, newPin);
      AppState.fetch = true;
    } catch(error) {
      console.log(error)
    }
  }
})




