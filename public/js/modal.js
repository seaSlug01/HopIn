import { elements, updateProfileTabs, copyImage, getScrollbarWidth, cordinates } from "./common.js"


function wrapperPadding(scrollbar = 0) {
  let padding;
  if(window.matchMedia("(min-width: 1300px) and (max-width: 1600px)").matches || window.matchMedia("(max-width: 1200px)").matches) {
    padding = `0 ${scrollbar}px 0 0`;
  } else if(window.matchMedia("(min-width: 1020px) and (max-width: 1300px)").matches) {
    padding = `0 calc(3vw + ${scrollbar}px) 0 0`
  } else {
    padding = `0 calc(12vw + ${scrollbar}px) 0 12vw`;
  }

  return padding;
}

export function openModal(target, callback) {
  const scrollbar = getScrollbarWidth();

  if (document.body.scrollHeight > document.body.clientHeight) {
      elements.wrapper.style.padding = wrapperPadding(scrollbar)
  }
  // check if there's another modal open
  if(document.querySelector(".modal.show")) {
    target.style.zIndex = 101;
    target.classList.add("bg-transparent");
  }

  document.body.classList.add("lock")
  target.classList.add("show");
  target.ariaHidden = "false";
  target.tabIndex = "0"

  if(callback) callback();
}


export let initialModalTarget = null;

export function closeModal(e, targetModal = null, callback) {
  if (initialModalTarget === e.target) {
    closingModalInitialState(targetModal || e.currentTarget)
    callback && callback();
  }
}

export function closingModalInitialState(modal) {
  modal.classList.remove("show");
  modal.ariaHidden = "true";
  modal.tabIndex = "-1";
  modal.classList.contains("bg-transparent") && modal.classList.remove("bg-transparent")
  document.body.classList.remove("lock");
}

const observeWrapper = new ResizeObserver((entries) => {
  entries[0].target.style.padding = wrapperPadding()
})
observeWrapper.observe(elements.wrapper)


export function setInitialModalTarget(e) {
  
    if(e.which !== 1) return;
    if(e.currentTarget === e.target || e.target.classList.contains("modal-close") || e.target.classList.contains("img-display")) {
      initialModalTarget = e.target
    } else {
      initialModalTarget = null;
    }
  //  e.currentTarget === e.target ? initialModalTarget = e.target : initialModalTarget = null;
}

const observeReplyModalHeight = new ResizeObserver((entries) => {
  const wrapperScroll = entries[0].target;
  const wrapperScrollHeight = entries[0].contentRect.height;
  
  if(wrapperScrollHeight >= (Math.floor(cordinates.visibleScreenHeight * 0.9))) {
    entries[0].target.classList.add("scrollable")
  } else {
    wrapperScroll.classList.contains("scrollable") && wrapperScroll.classList.remove("scrollable")
  }
})

// Edit profile user details modal in its own js file cuz in need of more functionality
// mousedown => if e.currentTarget === e.target => clickModal = modal;
// mouseup => if e.target = modal aka clickModal => close

// i click down on overlay, its the current target so initialTarget = overlay
// i click up on container, currentTARGET is overlay
if(elements.unfollowModal) {
  elements.unfollowModal.addEventListener("mousedown", setInitialModalTarget)
  elements.unfollowModal.addEventListener("mouseup", closeModal)
}

if(elements.cropperModal) {
  elements.cropperModal.addEventListener("mousedown", setInitialModalTarget)
  elements.cropperModal.addEventListener("mouseup", closeModal)
}

if(elements.reactionsModal) {
  elements.reactionsModal.addEventListener("mousedown", setInitialModalTarget)
  elements.reactionsModal.addEventListener("mouseup", e => closeModal(e, null, e.target.removeAttribute("data-msg-id")))
}

if(elements.modifyChatModal) {
  elements.modifyChatModal.addEventListener("mousedown", setInitialModalTarget)
  elements.modifyChatModal.addEventListener("mouseup", e => closeModal(e, null, () => elements.modifyChatModal.innerHTML = ""))
}

if(elements.replyModal) {
  elements.replyModal.addEventListener("mousedown", setInitialModalTarget)
  elements.replyModal.addEventListener("mouseup", closeModal)
  observeReplyModalHeight.observe(elements.replyModal.querySelector(".wrapperScroll"))
}

if(elements.deleteModal) {
  elements.deleteModal.addEventListener("mousedown", setInitialModalTarget)
  elements.deleteModal.addEventListener("mouseup", closeModal)
}

if(elements.imageGalleryModal) {
  elements.imageGalleryModal.addEventListener("mousedown", setInitialModalTarget)

  elements.imageGalleryModal.addEventListener("mouseup", e => closeModal(e, null, () => {
    elements.imageGalleryModal.querySelector(".galleryContent").innerHTML = "";
    const clone = elements.imageGalleryModal.querySelector(".galleryContent").cloneNode(true);
    elements.imageGalleryModal.querySelector(".galleryContent").remove();
    elements.imageGalleryModal.querySelector(".gallery").appendChild(clone)
  }))
}

// unfollow user
const confirmUnfollowUserBtn = document.getElementById("unfollowUser");


async function confirmUnfollowAction(e) {
  await axios.put(`/api/users/${e.target.dataset.userId}/follow`).then((res) => {
    if (res.status == 400) {
      alert("Something went wrong");
      return;
    }
    updateProfileTabs({following: res.data.followedUser.following, followers: res.data.followedUser.followers}, ["following", "followers"], res.data.followedUser._id);
    userLoggedIn.following = res.data.you.following;
    confirmUnfollowUserBtn.closest(".modal").classList.remove("show");
    const currentUserContainer = document.querySelector(`.userContainer[data-user-id="${e.target.dataset.userId}"]`) || document.querySelector(`.postContainer[data-user-id="${e.target.dataset.userId}"]`);
    currentUserContainer.querySelectorAll(".followButton").forEach(btn => {
      btn.classList.remove("following")
      btn.textContent = "Follow"
    })
    if(currentUserContainer.querySelector(".followersValue")) {
      currentUserContainer.querySelector(".followersValue").textContent = +currentUserContainer.querySelector(".followersValue").textContent - 1;
    }
  })
}

if(confirmUnfollowUserBtn) {
  confirmUnfollowUserBtn.addEventListener("click", confirmUnfollowAction);
}


// delete post
if(elements.deleteModal) {
  const deletePostButton = elements.deleteModal.querySelector(".danger");
  deletePostButton.addEventListener("click", async (e) => {
    const postId = e.target.getAttribute("data-post-id");

    await axios.delete("/api/posts/" + postId).then(() => {
      closingModalInitialState(elements.deleteModal)
      const isFeaturedPost = window.location.pathname.includes("posts") && window.location.pathname.split("/").pop() === postId;
      if(isFeaturedPost) {
        return window.location.href = window.location.origin
      } 
      document.querySelector(`.postContainer[data-post-id="${postId}"]`).remove();
      
    }).catch(error => console.error(error))
  })
}

