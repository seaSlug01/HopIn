import { docReady, outputPostsWithReplies, outputPosts, elements, createSpinner, altDescriptionListener, togglePostGIF, goBack, dataToObject, displayUserDetailsWindow } from "./common.js";
import { createPostForm } from "./postForm.js";
import { ImageSettings, VideoSettings } from "./MediaSettings.js";
import { createImageGallery } from "./PostImageGallery.js";

const postsState = {
  posts: {},
  lastPost: null
}

const setPostsState = (newPost) => {
  postsState.posts = {...postsState.posts, ...newPost}
}

document.querySelector(".navigate").addEventListener("click", goBack);


const postFormEl = document.querySelector(".postContainer.postForm");
const postForm = createPostForm("post", setPostsState);
const postMediaSelection = postForm.mediaSelection;

const replyForm = createPostForm("reply", setPostsState);
const replyMediaSelection = replyForm.mediaSelection;


const expandPostForm = e => {
  const replyingTo = document.createElement("div");
  replyingTo.classList.add("replyTo")
  replyingTo.innerHTML = `Replying to <a href="">${Object.values(postsState.posts)[0].postedBy.username}</a>`
  const postForm = e.target.closest(".postContainer");
  postForm.appendChild(replyingTo)

  postForm.querySelector(".btn-submit.fake").remove();
  postForm.classList.remove("contracted");
  postForm.classList.add("retracted")
  e.target.removeEventListener("focus", expandPostForm)
}



const postFormInitial = (replyId) => {
  function fakeReplyButton() {
    const fakeBtn = document.createElement("span");
    fakeBtn.classList.add("btn-submit");
    fakeBtn.classList.add("fake");
    fakeBtn.textContent = "Reply";
    postFormEl.appendChild(fakeBtn);
  }

  elements.postsContainer.insertBefore(postFormEl, elements.postsContainer.querySelector(".postContainer:nth-of-type(2)"));
  postFormEl.querySelector("form").setAttribute("data-replyid", replyId);
  postFormEl.classList.remove("d-none");
  fakeReplyButton()
}

document.getElementById("post").querySelector(".realTextarea").addEventListener("focus", expandPostForm)


document.addEventListener("click", (e) => {
  const modalTarget = e.target.dataset.target;

  if(modalTarget === "mediaSettings") {
    const mediaSelection = e.target.closest(".postForm").id === "post" ? postMediaSelection : replyMediaSelection;
    const mediaId = e.target.closest(".postMediaPreview__item").dataset.mediaId;
    const targetTab = e.target.dataset.tab;
    const selectedItem = mediaSelection.filesUploaded[mediaId];
    const selectedItemType = selectedItem.mediaType;
    if(selectedItemType === "image") {
      new ImageSettings(mediaSelection, mediaId, targetTab, e.target.closest(".postForm"));
    } else {
      new VideoSettings(mediaSelection, mediaId, targetTab, e.target.closest(".postForm"))
    }
    console.log("here", mediaSelection.filesUploaded[mediaId])
  }
})

window.addEventListener("click", (e) => altDescriptionListener(e, {
  post: postsState.posts,
  postMedia: postMediaSelection.filesUploaded,
  replyMedia: replyMediaSelection.filesUploaded
}))

elements.postsContainer.addEventListener("click", e => togglePostGIF(e, postsState.posts))

function showMoreRepliesButton() {
  const button = document.createElement("button");
  button.classList.add("postsContainer__btn-block");
  button.textContent = "Show more replies";

  elements.postsContainer.appendChild(button);
  button.addEventListener("click", fetchMoreReplies)
}

docReady(async () => {
  createSpinner(elements.postsContainer)
  try {
    const url = window.location.pathname.split("/");
    let {data: {postData, replies}} = await axios.get("/api/posts/" + url[url.length - 1]);
    postsState.posts = dataToObject([postData, ...replies])
    postsState.lastPost = replies[replies.length -1];
    
    outputPostsWithReplies({postData, replies: replies.length < 5 ? replies : replies.slice(0, replies.length - 1)}, elements.postsContainer)
    if(replies.length >= 5) {
      showMoreRepliesButton();
    }
    postFormInitial(postData._id)
  } catch (error) {
    console.log(error)
  }
});


async function fetchMoreReplies(e) {
  try {
    createSpinner(e.target)

    const posts = await axios.get("/api/posts", {
      params: { 
        replyTo: postsState.posts[window.location.pathname.split("/")[2]]._id,
        dateIndex: postsState.lastPost.createdAt
      }});

    
    outputPosts([postsState.lastPost, ...posts.data.slice(0, posts.data.length - 1)], elements.postsContainer, false);
    
    postsState.posts = {...postsState.posts, ...dataToObject(posts.data)}
    postsState.lastPost = posts.data[posts.data.length - 1]

    if(!posts.data.length) {
      elements.postsContainer.querySelector(".postsContainer__btn-block")?.remove();
    } else {
      e.target.innerHTML = "Show more replies"
      elements.postsContainer.insertAdjacentElement("beforeend", elements.postsContainer.querySelector(".postsContainer__btn-block"))
    }
  } catch(error) {
    e.target.innerHTML = "Show more replies"
    console.error(error);
  }
  
}

elements.postsContainer.addEventListener("click", (e) => createImageGallery(e, postsState.posts))

elements.postsContainer.addEventListener("mouseover", _.debounce(e => displayUserDetailsWindow(e, postsState.posts), 200))