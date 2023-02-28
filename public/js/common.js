export const AppState = {
  fetch: true,
  posts: [],
  "shares-replies": [],
  likes: [],
  followers: [],
  following: [],
  searchResults: {},
  searchTerm: "",
  searchHistory: sortSearchHistory(userLoggedIn.searchHistory)
}

function cleanupFirefox() {
  if (navigator.userAgent.indexOf("Firefox") != -1) {
    document.querySelectorAll(".realTextarea").forEach(area => area.value = "")
    const submitBtn = document.querySelector(".btn-submit");
    if(submitBtn) {
      // cuz this button is not in all pages
      submitBtn.disabled = true;
    }
  }
}

window.addEventListener("load", cleanupFirefox);

export const regexPatterns = {
  hashOrMentionRegex: new RegExp(/(^|\s)([#|@][a-zA-Z\d][\w-]*)/g),
}

export const elements = {
  main: document.querySelector("main"),
  sidebar: document.getElementById("sidebar-navigation"),
  postsContainer: document.querySelector('.postsContainer'),
  postTextarea: document.getElementById('postTextarea'),
  replyTextarea: document.getElementById('replyTextarea'),
  buttonsContainer: document.querySelector('.buttonsContainer'),
  buttonIcons: document.querySelectorAll('.btn-icon'),
  replyModal: document.getElementById("replyModal"),
  deleteModal: document.getElementById("deleteModal"),
  reactionsModal: document.getElementById("reactionsModal"),
  wrapper: document.querySelector(".wrapper"),
  tabsContainer: document.querySelector(".tabsContainer"),
  unfollowModal: document.getElementById("unfollowModal") || null,
  editProfileDetailsModal: document.getElementById("editProfileModal") || null,
  imageGalleryModal: document.getElementById("imageGalleryModal"),
  modifyChatModal: document.getElementById("modifyChatModal") || null,
  giphyModal: document.getElementById("giphy"),
  cropperModal: document.getElementById("cropperModal"),
  tabsContainer: document.querySelector(".tabsContainer")
}


export const cordinates = {
  visibleScreenHeight: window.innerHeight,
  midMedia: window.matchMedia("(max-width: 1600px)")
}

window.addEventListener("resize", () => {
  cordinates.visibleScreenHeight = window.innerHeight;
})

export const svgIcons = {
  publicIcon: `<svg viewBox="0 0 24 24" class="r-13gxpu9 r-4qtqp9 r-yyyyoo r-1q142lx r-50lct3 r-1sp7lne r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1srniue"><g><path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12S6.2 22.5 12 22.5 22.5 17.8 22.5 12 17.8 1.5 12 1.5zM9.047 5.9c-.878.484-1.22.574-1.486.858-.263.284-.663 1.597-.84 1.712-.177.115-1.462.154-1.462.154s2.148 1.674 2.853 1.832c.706.158 2.43-.21 2.77-.142.342.07 2.116 1.67 2.324 2.074.208.404.166 1.748-.038 1.944-.204.196-1.183 1.09-1.393 1.39-.21.3-1.894 4.078-2.094 4.08-.2 0-.62-.564-.73-.848-.11-.284-.427-4.012-.59-4.263-.163-.25-1.126-.82-1.276-1.026-.15-.207-.552-1.387-.527-1.617.024-.23.492-1.007.374-1.214-.117-.207-2.207-1.033-2.61-1.18-.403-.145-.983-.332-.983-.332 1.13-3.652 4.515-6.318 8.52-6.38 0 0 .125-.018.186.14.11.286.256 1.078.092 1.345-.143.23-2.21.99-3.088 1.474zm11.144 8.24c-.21-.383-1.222-2.35-1.593-2.684-.23-.208-2.2-.912-2.55-1.09-.352-.177-1.258-.997-1.267-1.213-.01-.216 1.115-1.204 1.15-1.524.056-.49-1.882-1.835-1.897-2.054-.015-.22.147-.66.31-.81.403-.36 3.19.04 3.556.36 2 1.757 3.168 4.126 3.168 6.873 0 .776-.18 1.912-.282 2.18-.08.21-.443.232-.595-.04z"></path></g></svg>`,
  plusIcon: `<svg viewBox="0 0 24 24" class="r-13gxpu9 r-4qtqp9 r-yyyyoo r-1q142lx r-50lct3 r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1srniue"><g><path d="M19.75 11H13V4.25c0-.553-.447-1-1-1s-1 .447-1 1V11H4.25c-.553 0-1 .447-1 1s.447 1 1 1H11v6.75c0 .553.447 1 1 1s1-.447 1-1V13h6.75c.553 0 1-.447 1-1s-.447-1-1-1z"></path></g></svg>`,
  comment: `<svg viewBox="0 0 24 24" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi"><g><path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67c0-.414-.335-.75-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path></g></svg>`,
  retweet: `<svg viewBox="0 0 24 24" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi"><g><path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"></path></g></svg>`,
  likeActive: `<svg viewBox="0 0 24 24" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi"><g><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z"></path></g></svg>`,
  likeMuted: `<svg viewBox="0 0 24 24" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi"><g><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 7.034 11.596 8.55 11.658 1.518-.062 8.55-5.917 8.55-11.658 0-2.267-1.823-4.255-3.903-4.255-2.528 0-3.94 2.936-3.952 2.965-.23.562-1.156.562-1.387 0-.014-.03-1.425-2.965-3.954-2.965z"></path></g></svg>`
};

export function elementContains(parent, child) {
  return parent !== child && parent.contains(child);
}

export const goBack = async () => {
  if(document.referrer.includes(window.location.host)){
    window.history.back();
  } else {
    window.location.href = window.location.href.split("/").slice(0, 3).join("/");
  }
}

export const dataToObject = (array) => {
  const obj = {};
  for(let item of array) {
    obj[item._id] = item;
  }

  return obj;
}

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function scrollToBottom(el) {
  el.scrollTop = el.scrollHeight;
}

export function getCursorPos(input) {
  if ("selectionStart" in input && document.activeElement == input) {
      return {
          start: input.selectionStart,
          end: input.selectionEnd
      };
  }
  else if (input.createTextRange) {
      var sel = document.selection.createRange();
      if (sel.parentElement() === input) {
          var rng = input.createTextRange();
          rng.moveToBookmark(sel.getBookmark());
          for (var len = 0;
                   rng.compareEndPoints("EndToStart", rng) > 0;
                   rng.moveEnd("character", -1)) {
              len++;
          }
          rng.setEndPoint("StartToStart", input.createTextRange());
          for (var pos = { start: 0, end: len };
                   rng.compareEndPoints("EndToStart", rng) > 0;
                   rng.moveEnd("character", -1)) {
              pos.start++;
              pos.end++;
          }
          return pos;
      }
  }
  return -1;
}

export function downloadLink(file) {
  let additionalLinkHeaders = "";
  if(file.mimetype === "text/plain") {
    additionalLinkHeaders = `data:text/html,`
  }

  const downloadLink = document.createElement("a");
  downloadLink.classList.add("downloadLink")

  downloadLink.href = `${additionalLinkHeaders}${file.path}`;
  downloadLink.setAttribute("target", "_blank");
  downloadLink.setAttribute("download", file.originalname);
  downloadLink.innerHTML = `<div class="downloadLink__icon"><i class="fa-solid fa-arrow-down"></i></div><span>Download</span>`

  return downloadLink;
}


export function timeDifference(current, previous, customMessages = {}) {

  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerWeek = msPerDay * 7;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;

  if (elapsed < msPerMinute) {
    if (elapsed / 1000 < 30) return customMessages.justNow || "Just now"

    return customMessages.seconds || Math.round(elapsed / 1000) + ' seconds ago';
  }

  else if (elapsed < msPerHour) {
    return customMessages.minutes || Math.round(elapsed / msPerMinute) + ' minutes ago';
  }

  else if (elapsed < msPerDay) {
    return customMessages.hours || Math.round(elapsed / msPerHour) + ' hours ago';
  }

  else if (elapsed < msPerWeek) {
    return customMessages.days || Math.round(elapsed / msPerHour) + ' days ago';
  }

  else if (elapsed < msPerMonth) {
    return customMessages.moreThanWeek || Math.round(elapsed / msPerDay) + ' days ago';
  }

  else if (elapsed < msPerYear) {
    return customMessages.months || Math.round(elapsed / msPerMonth) + ' months ago';
  }

  else {
    return Math.round(elapsed / msPerYear) + ' years ago';
  }
}


export async function getAverageRGB(imgEl) {
  
  var blockSize = 5, // only visit every 5 pixels
      defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
      canvas = document.createElement('canvas'),
      context = canvas.getContext && canvas.getContext('2d'),
      data, width, height,
      i = -4,
      length,
      rgb = {r:0,g:0,b:0},
      count = 0;
  
      imgEl.crossOrigin = '';


  if (!context) {
      return defaultRGB;
  }

   
  
  height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
  width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
  
  context.drawImage(imgEl, 0, 0);
  
  try { 
      data = context.getImageData(0, 0, width, height);
  } catch(e) {
      /* security error, img on diff domain */alert('x');
      return defaultRGB;
  }
  
  length = data.data.length;
  
  while ( (i += blockSize * 4) < length ) {
      ++count;
      rgb.r += data.data[i];
      rgb.g += data.data[i+1];
      rgb.b += data.data[i+2];
  }
  
  // ~~ used to floor values
  rgb.r = ~~(rgb.r/count);
  rgb.g = ~~(rgb.g/count);
  rgb.b = ~~(rgb.b/count);
  
  return rgb;
  
}

function detectHashtagsAndMentions(content, mentions) {
  return content.replace(regexPatterns.hashOrMentionRegex, (match) => {
    let isHash = match.trim().startsWith("#");
    let html = "";


    if(isHash) {
      html = `<a href="/search?q=${match.trim().substring(1)}" class='hash'>${match.trim()}</a>` 
    } else {
      const username = match.trim().substring(1);
      const user = mentions.find(m => m.userData?.username === username);
      if(user) {
        html = `<div class="user-details-block"><a href="${window.location.origin}/profile/${match.trim().substring(1)}" class='mention' data-toggle="user-details-modal" data-user-id="${user.userData._id}">${match.trim()}</a></div>`;
      } else {
        html = match.trim();
      }
    }

    return `${match.startsWith(" ") ? "&nbsp;" : ""}${html}`
  });
}

export function createElement(classList, tag = "div") {
  const doc = document.createElement(tag);
  if(classList !== "" || classList.length) {
    if(Array.isArray(classList)) {
      doc.classList.add(...classList)
    } else {
      doc.classList.add(classList)
    }
  }
  
  return doc
}


function findImageDescription(target, searchObj, searchTerm) {
  let alt;
  if(searchTerm == "postMedia" || searchTerm == "replyMedia") {
    alt = searchObj[searchTerm][target.closest(".postMediaPreview__item").dataset.mediaId].alt
  } else {
    const postContainer = target.closest(".postContainer");
    const allImages = Array.prototype.slice.call(postContainer.querySelectorAll(".postMediaPreview__item"))
    const targetImage = target.closest(".postMediaPreview__item")
    const imageIndex = allImages.indexOf(targetImage)
    const post = searchObj[searchTerm][postContainer.dataset.postId]
    alt = post.media[imageIndex].alt
  }

  return alt;
}


export function altDescriptionListener(e, searchObj) {

  if(e.target.classList.contains("alt-flag") || e.target.closest(".alt-flag") && e.target.tagName.toLowerCase() === "span") {
    elements.main.classList.add("noPointerEvents")
    const targetFlag = e.target.classList.contains("alt-flag") ? e.target : e.target.closest(".alt-flag");
    const alt = createElement("alt");
    const container = createElement("alt__container");

    const description = findImageDescription(targetFlag, searchObj, targetFlag.dataset.search)

    const header = createElement("alt__header", "h2")
    header.textContent = "Image Description"
    const text = createElement(["alt__text", "muted"], "p")
    text.textContent = description
    const dismissButton = createElement("alt__dismiss", "button")
    dismissButton.textContent = "Dismiss"


    alt.appendChild(container);
    [header, text, dismissButton].forEach(el => container.appendChild(el))
   

    targetFlag.appendChild(alt)
    const targetRect = targetFlag.getBoundingClientRect();


    if(targetRect.top + alt.offsetHeight > window.innerHeight) {
      alt.classList.add("facing-up");
      alt.style.top = `-${alt.offsetHeight + 20}px`
    }

    return;
  }
  
  if(!e.target.closest(".alt") || e.target.classList.contains("alt__dismiss")) {
    document.querySelector(".alt")?.remove();
    elements.main.classList.remove("noPointerEvents")
  }
}

function createPostImages(images, setDistance) {
  let postMediaPreview = `<div class="postMediaPreview postMediaPreview--${images.length} mt-${setDistance ? "3" : "1"} dontView postPreview">`

  for(let image of images) {
    const {path, originalname} = image;

    let altIndicaion = "";
    if(image.alt) {
      altIndicaion = `<div class='alt-flag' data-search="post"><span>ALT</span></div>`
    }

    postMediaPreview += `<div class="postMediaPreview__item">
                            <img src="${path}" alt="${originalname}" data-toggle="modal" data-target="imageGalleryModal" data-modal-type="post" data-toggle="modal" />
                            ${altIndicaion}
                         </div>`
  }

  const imagesWithSensitiveContent = images.filter(img => img["sensitiveContent"] !== undefined);
  if(imagesWithSensitiveContent.length) {
    const sensitiveContent = imagesWithSensitiveContent.reduce((acc = [], item) => {
      return acc.concat(...item.sensitiveContent)
    }, [])
    
    const {curtain, hideButton} = sensitiveContentTemplate({sensitiveContent: [...new Set(sensitiveContent)]});
    postMediaPreview += `${curtain}${hideButton}`
  }

  return postMediaPreview += "</div>"
}



function sensitiveContentTemplate(media, setDistance) {
  let curtain = "", hideButton = "";

  function setContentWarningText(sensitiveContentCategories) {
    return sensitiveContentCategories.map((category, i, arr) => {
      if(category === "sensitive") {
        category = "sensitive content";
      }

      if(i == 0) {
        return category.substring(0, 1).toUpperCase() + category.substring(1, category.length);
      }

      if(i > 0 && i < arr.length - 1) {
        console.log("if middle")
        return `, ${category}`
      } else {
        return `${arr.length == 2 ? "" : ","} and ${category}`
      }

      
    }).join("")
  }

  if(media.sensitiveContent && media.sensitiveContent.length) {
    let infoString = setContentWarningText(media.sensitiveContent);

    curtain = `<div class="overlay ${!setDistance && "less-padding"}">
                <div class="overlay__info">
                  <div class="overlay__info__icon">
                    <i class="fa-solid fa-eye-slash"></i>
                  </div>
                  <p class="overlay__info__heading">
                    Content warning: <span>${infoString}</span>
                  </p>
                  <p class="overlay__info__subHeading">
                    The author flagged this post as showing sensitive content.
                  </p>
                  <button class="overlay__info__action btn-rounded">
                    Show
                  </button>
                </div>
              </div>`

    hideButton = '<button class="btn-rounded hide-overlay">Hide</button>'
  }

  return {curtain, hideButton}
}


function createPostVideo(video, setDistance) {

  function addTrack(video) {
    return video.subs ? `<track src="${video.subs}" kind="subtitles" srclang="en" label="CC" />` : "";
  }

  const {path, thumbnail, mimetype } = video;

  const trackElement = addTrack(video);
  console.log(trackElement)
  const {curtain, hideButton} = sensitiveContentTemplate(video);

  const postMediaPreview = `<div class="postMediaPreview postPreview postMediaPreview__item--video active mt-${setDistance ? 3 : 1} dontView">
                              ${curtain}
                              <video class="video-js" controls preload="none" poster="${thumbnail}" crossorigin="anonymous">
                                <source src="${path}" type="${mimetype}" />
                                ${trackElement}
                              </video>
                              ${hideButton}
                            </div>`

  return postMediaPreview;
}

function createGIFPost(media, setDistance) {
  const animatedGIF = media[1];
  const {path, originalname, credits: {via}} = animatedGIF;
  let html = `<div class="postMediaPreview active mt-${setDistance ? 3 : 1} dontView">
                <div class="postMediaPreview__item postMediaPreview__item__GIF">
                  <div class="postMediaPreview__item__wrapper" show-play="false">
                    <img src="${path}" alt="${originalname}" playing="true" />
                  </div>
                  <p class="postMediaPreview__item__mentions muted">
                    via <a href="${via}" target="_blank">GIPHY</a>
                  </p>
                </div>
              </div>`

  return html;
}

export function togglePostGIF(e, posts) {
  if(e.target.parentElement.classList.contains("postMediaPreview__item__wrapper")) {
    const target = e.target.parentElement;
    const post = posts[target.closest(".postContainer").dataset.postId];
    const imageEl = target.querySelector("img");
    const imgSrc = imageEl.src;
    const otherImagePath = post.media.find(img => img.path !== imgSrc).path;
    const playing = imageEl.getAttribute("playing") == "true";

    target.setAttribute("show-play", playing ? true : false)
    imageEl.setAttribute("playing", playing ? false : true)
    imageEl.src = otherImagePath;
  }
}

function createPostMediaHTML(media, setDistance) {
  let mediaHTML = "";
  if(media.length) {
    const type = media[0].mediaType;

    switch(type) {
      case "image":
        mediaHTML = createPostImages(media, setDistance)
        break;
      case "video":
        mediaHTML = createPostVideo(media[0], setDistance)
        break;
      case "GIF":
        mediaHTML = createGIFPost(media, setDistance)
    }
  }

  return mediaHTML;
}



// User Details window

let userDetailsTimer = null;
let deleteUserDetailsTimer = null;

function hideUserDetails(e) {
  clearTimeout(deleteUserDetailsTimer);
  const target = e.target.classList.contains("userDetails-window") ? e.target : e.target.parentElement.querySelector(".userDetails-window");
  deleteUserDetailsTimer = setTimeout(() => {
    target?.remove();
  }, 300)
}

function userDetailsX(e, el) {
  const minMedia = window.matchMedia('(max-width: 1300px)');
  if (e.target.classList.contains("profileImage") && minMedia.matches) return el.style.left = 0;

  el.style.left = "50%";
  el.style.transform  = 'translateX(-50%)'
}

function userDetailsY(e, el) {
  if(e.target.getBoundingClientRect().top + el.offsetHeight > window.innerHeight) {
    el.style.top = `${e.target.offsetTop - el.offsetHeight - 10}px`
  } else {
    el.style.top = `${e.target.offsetTop + e.target.offsetHeight + 10}px`;
  }
  
}

export function displayUserDetailsWindow(e, state, delay = 300) {
  clearTimeout(userDetailsTimer)
  if(e.target.dataset.toggle === "user-details-modal") {
    
    deleteUserDetailsTimer = setTimeout(() => {
      document.querySelector(".userDetails-window")?.remove();
    }, delay)
    userDetailsTimer = setTimeout(() => {
      const detailsContainerBlock = e.target.classList.contains("user-details-block") ? e.target : e.target.closest('.user-details-block');
      const postContainer = e.target.closest(".postContainer")
      let user;
      if(postContainer.classList.contains("userContainer")) {
        user = state.find(u => u._id === postContainer.dataset.userId);
      } else {
        const postId = e.target.closest(".postContainer").dataset.postId;
        const post = state[postId] || state.find(p => p._id === postId)
        const userId = e.target.dataset.userId;
        const users = [post.postedBy].concat(post.mentions.map(m => m.userData));
        if(post.replyTo) {
          users.push(post.replyTo.postedBy);
        }
        user = users.find(u => u._id === userId);
      }
      

      const linkToProfile = userProfileLink(user);

      const userWindowTemplate =  `<div class="userDetails-window dontView" id="${crypto.randomUUID()}">
              <div class="profile-and-follow">
                <a href="${linkToProfile}" class="profileImage">
                      <img src="${user.profilePic}" alt="${user.username}'s profile picture"/>
                  </a>
                ${user._id !== userLoggedIn._id ?
                  `<button class="followButton ${userLoggedIn.following.includes(user._id) ? "following" : "black"} big" data-user-id="${user._id}">${userLoggedIn.following.includes(user._id) ? "Following" : "Follow"}</button>`
                  :
                  ""}
              </div>
              <div class="userDetails">
                <a href="${linkToProfile}" class="displayName">${user.firstName} ${user.lastName}</a>
                <a href="${linkToProfile}" class="username muted">@${user.username}</a>
                <p class="mb bio">${user.bio || ""}</p>
                <div class="followersContainer">
                  <a href="/profile/${user.username}/following"><span class="value"><strong>${user.following.length}</strong> Following</span></a>
                  <a href="/profile/${user.username}/followers"><span class="value"><strong class="followersValue">${user.followers.length}</strong> Followers</span></a>
                </div>
              </div>
            </div>`

      detailsContainerBlock.insertAdjacentHTML("beforeend", userWindowTemplate)
      
      const userDetails = postContainer.querySelector(".userDetails-window");
      userDetails.classList.add("userDetails-window__show");
      userDetails.addEventListener("mouseleave", hideUserDetails);
      e.target.addEventListener("mouseleave",  hideUserDetails)

      userDetails.addEventListener("mouseover", e => {
        clearTimeout(deleteUserDetailsTimer)
      });


      userDetailsY(e, userDetails, postContainer);
      userDetailsX(e, userDetails, detailsContainerBlock);
      
    }, delay)
    
  }
  
}

// User Details window end^


function userProfileLink(user) {
  return window.location.href.includes("profile") ?
  `${window.location.href.split(window.location.pathname)[0]}/profile/${user.username}` :
  `/profile/${user.username}`
}



export function createPostHtml(postData, largeFont = false, hideSettings = false) {

  if (postData == null) return alert("post object is null");

  let isSharedPost = postData.shareData !== undefined;
  let isSharedBy = isSharedPost ? postData.postedBy.username : null;

  // because the id could become shareData._id
  const docId = postData._id;
  postData = isSharedPost ? postData.shareData : postData;

  const { postedBy, content, shareUsers, pinned, media, likes, replyCount, mentions } = postData;
  const mediaTemplate = createPostMediaHTML(media, content.length);
  
  const timestamp = timeDifference(new Date(), new Date(postData.createdAt));
  const exactDate = moment(new Date(postData.createdAt)).format('LT') + " - " + moment(new Date(postData.createdAt)).format('ll');
  let youLiked = likes.includes(userLoggedIn._id);
  let youShared = shareUsers.includes(userLoggedIn._id);

  const postContent = detectHashtagsAndMentions(content, mentions);

  if (postedBy._id === undefined) {
    alert("postedby is undefined")
  }

  let sharedPostText = "";
  if (isSharedPost) {
    sharedPostText = `<div class="sharedBy"><span class="svg-wrapper">${svgIcons.retweet}</span><a href="/profile/${isSharedBy}"><span>Shared by @${isSharedBy}</a></div>`
  }

  let replyFlag = "";
  if (postData.replyTo && postData.replyTo._id) {
    console.log(postData.replyTo)

    if (!postData.replyTo._id) {
      return alert("Reply to is not populated")
    } else if (!postData.replyTo.postedBy._id) {
      return alert("Posted by is not populated")
    }


    var replyToUsername = postData.replyTo.postedBy.username;
    replyFlag = `<div class="replyFlag">
                  Replying to <div class="user-details-block"><a class="userLink" href="/profile/${replyToUsername}" data-toggle="user-details-modal" data-user-id="${postData.replyTo.postedBy._id}">@${replyToUsername}</a></div>
                </div>`
  }

  let userSettings = "";
  if (postData.postedBy._id === userLoggedIn._id && !hideSettings) {
    userSettings = `<div class="settings">
                    <button class="btn-icon more blue" data-toggle="tooltip" data-title="More">
                      <i class="fa-solid fa-ellipsis"></i>
                    </button>
                    <ul class="settings-tab">
                      <li class="settings-list-item delete"><i class="settings-list-item__icon fa-regular fa-trash-can"></i> Delete</li>
                      <li class="settings-list-item pin"><img class="settings-list-item__icon settings-list-item__icon--img" src="/icons/pin.svg" /><span>${pinned ? "Unpin from profile" : "Pin to your profile"}</span></li>
                    </ul>
                  </div>`
  }

  let pinLabel = "";
  if(pinned) {
    pinLabel = `<p class="pinned-post">
                  <span class="svg-wrapper"><i class="fa-solid fa-thumbtack"></i></span>
                  <span>Pinned post</span>
                </p>`
  }

  let linkToProfile = userProfileLink(postedBy);
  
  return `<div class="postContainer post" data-post-id="${postData._id}" data-user-id="${postData.postedBy._id}" id="${docId}">
            <div class="post-details">
              ${(isSharedPost || pinned) ? `<div class="additional-post-info">${sharedPostText} ${pinLabel}</div>` : ""}
              <div class="post-content ${(isSharedPost || pinned) && "pt-none"}">
                <div class="userImageContainer">
                  <div class="user-details-block">
                    <a href="${linkToProfile}">
                      <div class="profileImage" data-toggle="user-details-modal" data-user-id="${postedBy._id}">
                        <img src="${postedBy.profilePic}" alt="${postedBy.username}'s profile picture"/>
                      </div>
                    </a>
                </div>
              </div>
              <div class="content ${largeFont ? "largeFont" : ""}">
                <div class="postHeader">
                  <div class="info">
                    <div class="userDetails">
                      <div class="user-details-block">
                        <a class="displayName" href="${linkToProfile}" data-toggle="user-details-modal" data-user-id="${postedBy._id}">
                          <span class="displayName fullname">${postedBy.firstName} ${postedBy.lastName}</span>
                        </a>
                      </div>
                      <div class="user-details-block">
                        <a class="displayName" href="${linkToProfile}" data-toggle="user-details-modal" data-user-id="${postedBy._id}">
                          <span class="muted"> @${postedBy.username} ·</span>
                        </a>
                      </div>
                      <div class="date muted" data-toggle="tooltip" data-title="${exactDate}">
                        <span>${timestamp}</span>
                      </div>
                    </div>
                    ${replyFlag}
                  </div>
                  ${userSettings}
                </div>
                <div class="postBody">
                  <pre>${postContent}</pre>
                  ${mediaTemplate}
                </div>
                <div class="btn-group">

                  <button class="btn-block blue reply" data-toggle="tooltip" data-title="Reply">
                    <div class="btn-icon blue">
                      ${svgIcons.comment}
                      <div class="tooltip">Share</div>
                    </div>
                    <div class="count ${replyCount < 1 && "hide"}">
                      <span class="initial">${replyCount}<span>
                    </div>
                  </button>

                  <button class="btn-block green share ${youShared ? "active" : ""}" data-toggle="tooltip" data-title="Share">
                    <div class="btn-icon green">
                      ${svgIcons.retweet}
                      <div class="tooltip">Reply</div>
                    </div>
                    <div class="count ${!shareUsers.length && "hide"}">
                      <span class="initial">${shareUsers.length}<span>
                    </div>
                  </button>

                  <button class="btn-block red like ${youLiked ? "active" : ""}" data-firstClick="true" data-toggle="tooltip" data-title="${youLiked ? "Unlike" : "Like"}">
                    <div class="btn-icon red">
                      <div class="ball"></div>
                      <div class="tooltip">${youLiked ? "Unlike" : "Like"}</div>
                      ${youLiked ? svgIcons.likeActive : svgIcons.likeMuted}
                    </div>
                    <div class="count ${!likes.length && "hide"}">
                    <span class="initial">${likes.length}</span>
                  </div>
                    
                  </button>

                </div>
              </div>
            </div>
          </div>
  </div>`;
}

export function docReady(fn) {
  // see if DOM is already available
  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}



export function getScrollbarWidth() {

  // Creating invisible container
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll'; // forcing scrollbar to appear
  outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

  // Removing temporary elements from the DOM
  outer.parentNode.removeChild(outer);

  return scrollbarWidth;

}

export function outPutFollowersFollowing(users, container) {
  outputUsers(users, container, true, true, false)
}

export function outputSearchResults(users, container) {
  outputUsers(users, container, false, false, true)
}

function createUserHTML(userData, showFollowButton, showUserDetailsWindow, isLink) {
  const { _id, profilePic, username, firstName, lastName, followers, bio } = userData;

  let followsUser = followers.includes(userLoggedIn._id);
  let followButton = "";
  if(showFollowButton && userLoggedIn._id != _id) {
    followButton = `<button class="followButton ${followsUser ? "following" : ""}" data-alert="unfollow">
                      ${followsUser ? "Following" : "Follow"}
                    </button>`
  }

  let userWindowAttributes = ""
  if(showUserDetailsWindow) {
    userWindowAttributes = [`data-toggle="user-details-modal"`, `data-user-id="${_id}"`].join(" ")
  }


  return `<div class="postContainer userContainer" data-user-id="${_id}">
            <div class="post-details">
              <div class="post-content">
              <div class="userImageContainer">
                <div class="user-details-block">
                  <a href="/profile/${username}" class="profileImage" ${userWindowAttributes}>
                    <img src="${profilePic}" alt="${username}'s profile picture"/>
                  </a>
                </div>
            </div>
            <div class="content">
              <div class="postHeader">
              
                <div class="userDetails">
                  <div class="user-details-block">
                    <a href="/profile/${username}" class="displayName" ${userWindowAttributes}>
                      <p class="fullname">${firstName} ${lastName}</p>
                      <p class="muted username" style="text-decoration: none;">@${username}</p>
                    </a>
                  </div>    
                </div>
                
                ${followButton}      
              </div>
              ${bio ? `<span>${bio}</span>` : ""}
            </div>
          </div>
        </div>
      </div>`;
}

export function outputUsers(users, container, showFollowButton, showUserDetailsWindow) {
  container.innerHTML = "";

  users.forEach(user => {
    let html = createUserHTML(user, showFollowButton, showUserDetailsWindow)
    container.insertAdjacentHTML("beforeend", html);
  })
}

export async function outputPosts(results, container, clearHTML) {
  if(clearHTML) {
    container.innerHTML = "";
  }
  
  if (!Array.isArray(results)) {
    results = [results];
  }

  let html = "";
  results.forEach((post, index) => {
    html += createPostHtml(post, false, index);
  })

  container.insertAdjacentHTML("beforeend", html);

  AppState.fetch = false;
}

export function outputPostsWithReplies(results, container) {
  container.innerHTML = "";
  if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
    let html = createPostHtml(results.replyTo);
    container.insertAdjacentHTML("beforeend", html);
  }

  let mainPostHTML = createPostHtml(results.postData, true);
  container.insertAdjacentHTML("beforeend", mainPostHTML);

  results.replies.forEach(post => {
    let html = createPostHtml(post);
    container.insertAdjacentHTML("beforeend", html);
  })
}




// followButton
export async function directFollowAction(userId, followersValue, buttons) {

  if(!NodeList.prototype.isPrototypeOf(buttons)) {
    buttons = [buttons]
  }

  await axios.put(`/api/users/${userId}/follow`).then((res) => {
    if (res.status == 400) {
      alert("User not found");
      return;
    }
    
    const youAreFollowing = res.data.you.following && res.data.you.following.includes(userId);
    userLoggedIn.following = res.data.you.following
    
    updateProfileTabs({following: res.data.followedUser.following, followers: res.data.followedUser.followers}, ["following", "followers"], res.data.followedUser._id)

    if (youAreFollowing) {
      buttons.forEach(button => {
        button.classList.add("following")
        button.textContent = "Following";
      })
    } else {    
      buttons.forEach(button => {
        button.classList.remove("unfollow", "following");
        button.textContent = "Follow";
      }) 
    }

    
    let difference = youAreFollowing ? 1 : -1;
    if (followersValue?.textContent) {
      followersValue.textContent = +followersValue.textContent + difference;
    }
  }).catch(err => console.log(err))
  
}

function createUnfollowUserModal(user) {
  const unfollowModal = document.getElementById("unfollowModal")
  const title = unfollowModal.querySelector(".modal-header h3");
  title.textContent = `Unfollow @${user.username}?`
  const unfollowBtn = unfollowModal.querySelector(".btn-dark");
  unfollowBtn.setAttribute("data-user-id", user._id);
  
  unfollowModal.classList.add("show");  
}

export async function followUserActions(e) {
  // this function needs to bind this to an element(if you wanna update the count on the frontend)
  // bind this with a call or apply, not .bind() cuz you also need the event
  if (e.target.classList.contains("followButton")) {
    let button = e.target;
    const userId = button.getAttribute("data-user-id") || button.closest(".postContainer").getAttribute("data-user-id");
    const followersValue = this.querySelector(".followersValue");

    if(button.dataset.alert === "unfollow" && button.classList.contains("following")) {
      await axios.get(`/api/users/${userId}`).then((res) => {
        if (res.status == 400) {
          alert("User not found");
          return;
        }
        createUnfollowUserModal(res.data);
      })
    } else {
      if(e.target.closest(".userContainer")) {
        // In the userContainer there is more than one button
        button = e.target.closest(".userContainer").querySelectorAll(".followButton");
      }
      
      directFollowAction(userId,followersValue,button)
    }  
  }
}


// spinner
export function createSpinner(container, clearHTML) {
  if(clearHTML) {
    container.innerHTML = "";
  }
  const spinnerHtml = `<div class='spinnerContainer'>
                  <div class='spinner'></div>
                </div>`

  container.insertAdjacentHTML("beforeend", spinnerHtml);
}


export function spinnerV2(container) {
  const spinnerContainer = document.createElement("div");
  spinnerContainer.classList.add("messages-loading-spinner");
  const spinner = document.createElement("div");
  spinner.classList.add("message-spinner");

  container.appendChild(spinnerContainer);
  spinnerContainer.appendChild(spinner);
  gsap.fromTo(spinner, {rotate: 0}, { rotate: 350, duration: 1, ease: "slow(0.7, 0.7, false)", repeat: -1 })
}


// UnFollow Button Hover State
const unfollow = {
  btn: null,
  setUnfollow: function() {
    this.classList.remove("unfollow");
    if(this.classList.contains("following")) this.textContent = "Following";
    this.style.transition = "all 0.3s ease";
    this.removeEventListener("mouseleave", unfollow.setUnfollow);   
  }
}

window.addEventListener("mouseover", e => {
  if(e.target.classList.contains("following")) {
    unfollow.btn = e.target;
    unfollow.btn.classList.add("unfollow");
    unfollow.btn.textContent = "Unfollow";
    unfollow.btn.style.transition = "none";
    unfollow.btn.addEventListener("mouseleave", unfollow.setUnfollow)
  }
})

// update Front End
export function updateProfileTabs(newValue, collections, docId) {
  for(let collection of collections) {
    updateDocs({newValue, collection}, docId);
  }
}

function updateDocs(operation, docId) {
  const {newValue, collection} = operation;
  let document = AppState[collection].find(doc => doc._id === docId)
  const index = AppState[collection].indexOf(document);
  if(index !== -1) {
    Object.assign(AppState[collection][index], newValue);
  }
}

// Function to check if browser supports an attribute, css selector and such (similar to @supports)
export const isSelectorSupported = (selector) => {
  try {
      document.querySelector(selector)
      return true
  } catch (error) {
      return false
  }
}
// Using it below (returns true in chrome and false in firefox)
// const isSupported = isSelectorSupported(":has(input)")

export const copyImage = (imgEl, className) => {
  const newImage = document.createElement("img");
  newImage.classList.add(className);
  newImage.src = imgEl.src;

  return newImage;
}

export function validSelectors(eventTarget, selectors) {
  return selectors.every(selector => eventTarget !== selector);
}

export const mimicAncherTag = (e, targetClass, targetAttribute, targetHref, excludedSelectors, extraConditions) => {
  if(e.target.closest(`.${targetClass}`)) {
    const container = e.target.closest(`.${targetClass}`);
    const id = container.getAttribute(targetAttribute);
    let selectorsAreValid = validSelectors(e.target, excludedSelectors)
      if (id && selectorsAreValid && extraConditions) {
        window.location.href = targetHref + id;
    }
  }
}

export const mimicAncherTagDescriptive = async (e, targetContainer, excludedSelectors, isSearch = false) => {
  if(e.target.closest(`.${targetContainer}`)) {
    const container = e.target.closest(`.${targetContainer}`);
    const targetHrefEl = container.querySelector(`a`);
    let selectorsAreValid = validSelectors(e.target, excludedSelectors);
    if(selectorsAreValid) {
      if(isSearch) {
        const userId = container.getAttribute("data-user-id");
        const fullName = container.querySelector(".fullname").textContent;
        const username = container.querySelector(".username").textContent.replace("@", "");
        const image = container.querySelector("img").src;
        const {data: {searchHistory} } = await axios.post("/search/history", {id: userId, type: "user", fullName, username, image })
        AppState.searchHistory = searchHistory
      }
      window.location.href = targetHrefEl.getAttribute("href");
    }
  }
}

export function sortSearchHistory(arr) {
  const sorted = arr.sort((a,b) => {
    let points = 0;

    // the thing with date is that 2 dates being around the same minute will return 0
    // and 0 means the item stays at its current position
    // but in this case "< 0" means no points added
    // so in that case it sees both items views are set to default 1, so 1 - 1 = 0
    // nothing changes
    if(new Date(b.createdAt) - new Date(a.createdAt) <= 0) {
      points = 1;
    }

    return b.views - (a.views + points)
  })

  return sorted;
}

export function appendToHeader(element) {
  document.querySelector(".header").append(element)
}


// Tooltips
function translateY($el) {
  const r = $el.getBoundingClientRect()

  let elH = $el.offsetHeight,
  H   = $el.closest(".chatMessagesContainer").offsetHeight, t=r.top - $el.closest(".chatMessagesContainer").offsetTop, b=r.bottom

  let tooltipOffset = parseInt($el.getAttribute("offset"));
  let offset = $el.closest(".chatMessagesContainer").lastElementChild == $el.closest(".messageContainer") ? -tooltipOffset / 2 : tooltipOffset;

  if(t < 0 && Math.abs(t) + Math.max(Math.min(b, H)) < elH) {
    return Math.abs(t) + (Math.max(Math.min(b, H) - offset) / 2);
  }

  if(t < 0) {
    return elH - (Math.max(Math.min(b, H)) - offset) / 2;
  }

  if(t > 0) {
    return (Math.max(Math.min(elH, H-t)) - offset) / 2;
  }
}

function messageTooltipPosition(container, tooltip, translateY, inDOM = false) {
  const sentByYou = container.closest(".messageContainer").classList.contains("you");
  const translateX = sentByYou ? -1 : 1;
  if(!inDOM) {
    tooltip.style.top = 0;
    tooltip.style.left = sentByYou ? "auto" : "100%";
    tooltip.style.right = sentByYou ? "100%" : "auto";
    tooltip.style.bottom = "auto"; // overide the bottom = 0;
  }
  tooltip.style.transform = `translate(${translateX}px, ${translateY})`; 
}

export function setMessageTooltipPosition(parentEl, tooltip, inDOM = false) {
  messageTooltipPosition(parentEl, tooltip, `${translateY(parentEl)}px`, inDOM);
}

function setMessageTypeTooltip(parentEl, tooltip) {
  if(parentEl.classList.contains("you")) {
    parentEl.append(tooltip);
  } else {
    parentEl.prepend(tooltip) 
  }

  tooltip.setAttribute("following-tp", "");
}

let tooltipCreateTimer = null;
function createTooltip(e) {
  if (e.target.dataset.toggle === "tooltip" || e.target.closest("[data-toggle='tooltip']")) {
    clearTimeout(tooltipCreateTimer);
    const parentEl = e.target.closest("[data-toggle='tooltip']") ? e.target.closest("[data-toggle='tooltip']") : e.target;
    

    const {tooltipColor, tooltipType, delay, messageTooltip} = parentEl.dataset;
    let tooltip = messageTooltip ? parentEl.querySelector(".tooltip[following-tp]") : parentEl.querySelector(".tooltip");

    if(!tooltip) {
      tooltip = document.createElement("div");
      tooltip.classList.add("tooltip")

      if(tooltipColor) {
        tooltip.classList.add("black");
      }

      if(tooltipType) {
        tooltip.setAttribute("data-type", tooltipType);
      }

      if(delay) {
        tooltip.style.transitionDelay = `${+delay / 1000}s`;
      }

      tooltipCreateTimer = setTimeout(() => {
        if(messageTooltip) {
          setMessageTypeTooltip(parentEl, tooltip)
        } else {
          parentEl.append(tooltip);
        }
        
      }, +delay || 500)
    }
    
    if(messageTooltip) {
      setMessageTooltipPosition(parentEl, tooltip)
    }
    tooltip.textContent = parentEl.getAttribute("data-title");
    tooltip.classList.add("show");
  }
}

function hideTooltip(e) {
  if (e.target.dataset.toggle === "tooltip") {
    const tooltip = e.target.querySelector(".tooltip");
    if(tooltip) {
      tooltip.classList.remove("show")
    }
  }
}

document.body.addEventListener("mouseover", createTooltip);
window.addEventListener("click", hideTooltip)


document.body.addEventListener("mouseout", e => {
  if (e.target.dataset.toggle === "tooltip" || e.target.closest("[data-toggle='tooltip']")) {
    clearTimeout(tooltipCreateTimer);
    const parentEl = e.target.closest("[data-toggle='tooltip']") ? e.target.closest("[data-toggle='tooltip']") : e.target;
    const tooltip = parentEl.querySelector(".tooltip");
    tooltip && tooltip.classList.remove("show");
  }
})





