import { docReady, elements, outputPosts, followUserActions, createSpinner, AppState, goBack, copyImage, altDescriptionListener, togglePostGIF, dataToObject, displayUserDetailsWindow  } from "./common.js";
import { createPostForm } from "./postForm.js";
import { addHash, getTargetTab, targetTab, getUrlHash } from "./tabs.js";
import {openModal, closingModalInitialState} from "./modal.js";
import { createImageGallery } from "./PostImageGallery.js";


const postsState = {
  posts: {
    posts: {},
    lastPostVisible: null,
    fetch: true
  },
  "shares-replies": {
    posts: {},
    lastPostVisible: null,
    fetch: true
  },
  likes: {
    posts: {},
    lastPostVisible: null,
    fetch: true
  },
  postLimit: 10
}


function setPostsState(newData) {
  const state = postsState[getUrlHash()]
  state.posts = {...state.posts, ...dataToObject(newData)}
  state.lastPostVisible = newData[newData.length - 1];
  state.fetch = newData.length >= postsState.postLimit;
}

document.querySelector(".navigate").addEventListener("click", goBack);

const replyForm = createPostForm("reply", () => {});
const replyMediaSelection = replyForm.mediaSelection;

// docReady func uses the DOMContentLoaded event, which waits for the HTML document to be completely parsed, 
// as well as all deferred scripts (<script defer src="…"> and <script type="module"> [Which I heavily use]) have downloaded and executed
// It will NOT wait for images and async scripts TO FINISH loading.
docReady(async () => {
  const hash = getUrlHash();
  const params = createParams(hash);
  await loadPosts(params);
  

  document.querySelector(`.${hash}`).classList.add("active");
  targetTab.current = document.querySelector(`.${hash}`);
})

const fetchPostsScroll = _.throttle(async e => {

  if((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight && Object.keys(postsState[getUrlHash()].posts).length) {
    // I check for if there's already posts so I can initiate my scrolling function
    // otherwise there's no point for loading posts, docReady takes care of fetching the first ones
    // and there's also a bug, where switching tab and clearing the html forces scroll
    // so events "hashchange" and "scroll" are triggered together and fetch the same posts...
    // since clearing the html fullfills the scrolls base condition: (window.innerHeight + window.pageYOffset) >= document.body.offsetHeight)
    try {
      const hash = getUrlHash();
      const params = createParams(hash);
      await loadPosts(params);
    } catch(error) {
      console.error(error)
    } finally {
      elements.postsContainer.querySelectorAll(".spinnerContainer").forEach(el => el.remove())
    }
  }
}, 500)

window.addEventListener("scroll", fetchPostsScroll);

elements.tabsContainer.addEventListener("click", async (e) => {
  if (e.target.classList.contains("tab-link")) {
    e.preventDefault();

    if (e.target.classList.contains("active")) return;

    const targetTab = getTargetTab(e);
    addHash(targetTab);
  }
  
})

window.addEventListener('hashchange', (e) => {
  document.querySelector(".postsContainer").style.paddingTop = 0;
  const oldHash = e.oldURL.split("#")[1] || "posts";
  const newHash = e.newURL.split("#")[1] || "posts";
  document.querySelector(`.${oldHash}`).classList.remove("active");
  document.querySelector(`.${newHash}`).classList.add("active");


  if(AppState[newHash].length && !AppState.fetch) {
    outputPosts(AppState[newHash], elements.postsContainer, true)
  } else {
    postsState[newHash].lastPostVisible = null;
    postsState[newHash].fetch = true;
    postsState[newHash].posts = {};
    const params = createParams(newHash);
    loadPosts(params, newHash);
  }
});


async function loadPosts(params = null, newHash = null) {
  const hash = newHash ?? getUrlHash();
  if(postsState[hash].fetch) {
    try {
      createSpinner(elements.postsContainer, !Object.keys(postsState[hash].posts).length)
      let posts = await axios.get("/api/posts", params);

      if(hash === "posts" && !Object.keys(postsState[hash].posts).length) {
        console.log(profileUserId)
        const pinnedPost = await axios.get("/api/posts/getPost", { params: { pinned: true, postedBy: profileUserId }})
        if(pinnedPost.data) {
          posts.data.unshift(pinnedPost.data)
          console.log(pinnedPost)
        }
      }

      console.log(posts.data);
      
      if (posts.data.length === 0 && !Object.keys(postsState[hash].posts).length) {
        elements.postsContainer.innerHTML = "";
        elements.postsContainer.insertAdjacentHTML("beforeend", "<span class='empty'>No posts yet</span>");
        return;
      }
  
      AppState[hash] = [...AppState[hash], ...posts.data]
      outputPosts(posts.data, elements.postsContainer, !Object.keys(postsState[hash].posts).length);
      setPostsState(posts.data);
    } catch (error) {
      console.log(error)
    }
  }
}

const createParams = (hash) => {
  let params = { params: { postedBy: profileUserId, filter: {pinned: false}, share: false, limit: 10, dateIndex: postsState[hash].lastPostVisible?.createdAt } }
  
  switch (hash) {
    case "posts" || "":
      return params
    case "shares-replies":
      return { params: { postedBy: profileUserId, isReply: true, share: true, limit: 10, dateIndex: postsState[hash].lastPostVisible?.createdAt } }
    case "likes":
      return { params: { likedBy: profileUserId, likes: true, limit: 10, dateIndex: postsState[hash].lastPostVisible?.createdAt  } }
  }
}

const userContainer = document.querySelectorAll(".userContainer")[0];
// FollowButton
userContainer.addEventListener("click", async e => followUserActions.call(userContainer, e))


function displayImages(e) {
  const type = e.target.dataset.type;
  const container = elements.imageGalleryModal.querySelector(".galleryContent");
  const images = [];
  if(type === "profilePic") {
    const newImage = copyImage(e.target.querySelector("img"), "profilePic");
    images.push(newImage);
  } else if(type === "coverPic") {
    const newImage = copyImage(e.target, "coverPic");
    images.push(newImage);
  }

  Element.prototype.append.apply(container, images);
}


let galleryElementClicked = null;

document.querySelector(".profileContainer").addEventListener("click", e => {
  if(e.target.dataset.target === "imageGalleryModal") {
    const galleryModal = document.getElementById(e.target.dataset.target);
    const galleryContent = galleryModal.querySelector(".galleryContent")
    openModal(galleryModal);
    galleryContent.innerHTML = "";

    galleryContent.addEventListener("mousedown", e => {
      console.log(e.target)
      if(e.target === e.currentTarget) {
        galleryElementClicked = e.target;
      }
    })

    galleryContent.addEventListener("mousedown", e => {
      console.log(e.target)
      if(e.target === e.currentTarget) {
        galleryElementClicked = e.target;
      }
    })

    galleryContent.addEventListener("mouseup", e => {
      if(e.target === galleryElementClicked) {
        closingModalInitialState(galleryModal);
        galleryContent.innerHTML = "";
        const clone = galleryContent.cloneNode();
        galleryContent.remove();
        galleryModal.querySelector(".gallery").appendChild(clone);
      }
    })

    displayImages(e);

    
  }
})

document.addEventListener("click", (e) => {
  const modalTarget = e.target.dataset.target;

  if(modalTarget === "mediaSettings") {
    const mediaSelection = replyMediaSelection;
    const mediaId = e.target.closest(".postMediaPreview__item").dataset.mediaId;
    const targetTab = e.target.dataset.tab;
    const selectedItem = mediaSelection.filesUploaded[mediaId];
    const selectedItemType = selectedItem.mediaType;
    if(selectedItemType === "image") {
      new ImageSettings(mediaSelection, mediaId, targetTab, e.target.closest(".postForm"));
    } else {
      new VideoSettings(mediaSelection, mediaId, targetTab, e.target.closest(".postForm"))
    }
  }
})

window.addEventListener("click", (e) => altDescriptionListener(e, {
  post: postsState[getUrlHash()].posts,
  replyMedia: replyMediaSelection.filesUploaded
}))

elements.postsContainer.addEventListener("click", e => togglePostGIF(e, postsState[getUrlHash()].posts))

elements.postsContainer.addEventListener("click", (e) => createImageGallery(e, postsState[getUrlHash()].posts))

elements.postsContainer.addEventListener("mouseover", _.debounce(e => displayUserDetailsWindow(e, postsState[getUrlHash()].posts), 200))









