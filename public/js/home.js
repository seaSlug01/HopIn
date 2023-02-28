import { docReady, outputPosts, elements, createSpinner, altDescriptionListener, togglePostGIF, dataToObject, displayUserDetailsWindow } from "./common.js";
import { createPostForm } from "./postForm.js";
import { ImageSettings, VideoSettings } from "./MediaSettings.js";
import { createImageGallery } from "./PostImageGallery.js";

var postsState = {
  posts: {},
  oldestPostVisible: null,
  scroll: true
}

const setPostState = (newPost) => {
  postsState.posts = {...postsState.posts, ...newPost}
}

const postForm = createPostForm("post", setPostState);
const postMediaSelection =postForm.mediaSelection;

const replyForm = createPostForm("reply", setPostState);
const replyMediaSelection = replyForm.mediaSelection;

docReady(async () => {
  try {
    await fetchPosts(true)
  } catch (error) {
    console.log(error)
  } finally {
    elements.postsContainer.querySelector(".spinnerContainer").remove();
    postsState.scroll = true;
  }

});

async function fetchPosts() {
  if(postsState.scroll) {
    createSpinner(elements.postsContainer, false)
    const limit = 10;
    const posts = await axios.get("/api/posts", {params: {followingOnly: true, dateIndex: postsState.oldestPostVisible?.createdAt ?? null, limit }});
    postsState.scroll = false;

    postsState.posts = {...postsState.posts, ...dataToObject(posts.data)}
    postsState.oldestPostVisible = posts.data[posts.data.length - 1]
    outputPosts(posts.data, elements.postsContainer, Object.keys(postsState.posts) === limit);

    if (posts.data.length === 0 && !Object.keys(postsState.posts).length) {
      elements.postsContainer.insertAdjacentHTML("beforeend", "<span>No posts yet</span>");
    } else if(posts.data.length < limit) {
      elements.postsContainer.insertAdjacentHTML("beforeend", "<span class='scrollEnd'>You've reached the end</span>");
      window.removeEventListener("scroll", fetchPostsScroll)
    }
  }
}


// a scrolling func need to be made
// there will be a latest message in the params

const fetchPostsScroll = _.throttle(async e => {

  if((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
    try {
      await fetchPosts(false)
    } catch(error) {
      console.error(error)
    } finally {
      elements.postsContainer.querySelector(".spinnerContainer").remove();
      postsState.scroll = true;
    }
  }
}, 500)

window.addEventListener("scroll", fetchPostsScroll)





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

elements.postsContainer.addEventListener("click", (e) => createImageGallery(e, postsState.posts))

elements.postsContainer.addEventListener("mouseover", _.debounce(e => displayUserDetailsWindow(e, postsState.posts), 200))



