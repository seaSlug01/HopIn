import { createPostHtml, elements, regexPatterns, getCursorPos, cordinates, createLoadingBar } from "./common.js"
import { EmojiSelection } from "./emoji.js";
import { UploadPostMedia, uploadPostMediaTemplate } from "./UploadDropzone.js";
import {toggleActive, countOperations } from "./posts.js";

const { postsContainer } = elements;


const { hashOrMentionRegex } = regexPatterns;
let lockedContainer;
let cursorPosition = 0
let initialTagListDistanceFromTop;

const getKeyAttributes = (textarea, form, lettersLimit = 280) => {
  const lettersCounterContainer = form.querySelector('.lettersCounter');
  const lettersRemainingSpan = lettersCounterContainer.querySelector('span');

  const letterCounterSVG = lettersCounterContainer.querySelector("svg");
  const coloredCircle = letterCounterSVG.querySelector('.circle2');

  const letters = textarea.value.length;
  const radius = coloredCircle.getAttribute('r');
  const perimeter = radius * 2 * Math.PI;
  const reduceDashOffset = perimeter / lettersLimit;
  let lettersRemaining = lettersLimit - letters;

  return {
    letters,
    lettersLimit,
    perimeter,
    reduceDashOffset,
    lettersRemaining,
    coloredCircle,
    lettersRemainingSpan,
    lettersCounterContainer,
    letterCounterSVG
  };
};

const calculateDashoffset = (circle, perimeter, letters, reduceDashOffset) => {
  const dashOffset = perimeter - letters * reduceDashOffset;

  dashOffset >= 0
    ? (circle.style.strokeDashoffset = dashOffset)
    : (circle.style.strokeDashoffset = 0);
};

const showLettersRemaining = (lettersRemaining, span) => {
  span.textContent = lettersRemaining;

  lettersRemaining <= 20
    ? span.classList.add('show')
    : span.classList.remove('show');

  if (lettersRemaining <= 0) {
    span.style.fontWeight = '400';
    span.classList.add('red');
  } else {
    span.style.fontWeight = 'bold';
    span.classList.remove('red');
  }
};

const strokeColor = (circle, lettersRemaining) => {
  lettersRemaining > 20 && (circle.style.stroke = 'rgb(29, 161, 242)');
  lettersRemaining <= 20 && (circle.style.stroke = 'orange');
  lettersRemaining <= 0 && (circle.style.stroke = 'red');
};

const setLettersCounterSVG = (letterCounterSVG, lettersRemaining, circle) => {
  if (lettersRemaining <= 20) {
    letterCounterSVG.style.transform =
      'translate(-50%, -50%) rotate(-90deg) scale(1.4)';
    circle.style.strokeWidth = '1px';
  } else {
    letterCounterSVG.style.transform =
      'translate(-50%, -50%) rotate(-90deg) scale(1)';
    circle.style.strokeWidth = '2px';
  }

  // Set circle visibility
  lettersRemaining <= -10
    ? letterCounterSVG.classList.add('hide')
    : letterCounterSVG.classList.remove('hide');
};

function adjustTextareaHeight(textarea, contentEditable) {
  textarea.style.height = "5px";
  textarea.style.height = (textarea.scrollHeight + 7) + "px";
  contentEditable.style.height = textarea.style.height;
  // contentEditable.scrollTop = textarea.scrollTop;

  // adjust tagList el too
  const tagList = document.getElementById("tagList") || null;
  if(tagList) {
    setTagListPosition(tagList, textarea)
  }
}

function markIfOverLimit(val, limit, contentEditable) {
  if (val.length > limit) {
    const valid = val.substring(0, limit);
    const invalid = val.substring(limit);

    let validSpan = document.createElement("span");
    validSpan.innerHTML = valid.replace(hashOrMentionRegex, `$1<span class='highlight--blue'>$2</span>`);

    let errorSpan = document.createElement("span");
    errorSpan.classList.add("mark");
    errorSpan.textContent = invalid;

    contentEditable.innerHTML = "";
    contentEditable.appendChild(validSpan);
    contentEditable.appendChild(errorSpan);
  }
}

function showCounter(lettersCounterContainer, valLength) {
  valLength > 0 ? lettersCounterContainer.style.display = "block" : lettersCounterContainer.style.display = "none"
}

function setInitialTextareaState(e, mediaSelection) {
  // textarea, textarea.nextElementSibling, e.target.querySelector("input[type='hidden']")
  const textarea = e.target.querySelector(".realTextarea")
  const contentEditable = textarea.nextElementSibling;
  const mediaPreviewContainer = e.target.querySelector(".postMediaPreview");
  const hiddenInput = e.target.querySelector("input[type='hidden']");
  const submitButton = e.target.querySelector(".btn-submit");
  const lettersCounterContainer = e.target.querySelector(".lettersCounter");

  mediaSelection.filesUploaded = {}
  mediaSelection.removeAllFiles(true)

  textarea.value = "";
  contentEditable.textContent = "";
  adjustTextareaHeight(textarea, contentEditable)
  mediaPreviewContainer.classList.remove("active")
  mediaPreviewContainer.innerHTML = "";
  hiddenInput.value = "";
  submitButton.disabled = true;
  lettersCounterContainer.style.display = "none";
  Array.from(document.querySelectorAll(".buttonsContainer .btn-group")[0].querySelectorAll("button")).slice(0,2).forEach(mediaButton => mediaButton.disabled = false)
}

// TAGS START //

function getTagList(value) {
  let matches = [...value.matchAll(hashOrMentionRegex)]?.map((match, i) => {
    let startsFrom = match.index;
    let word = match[0];
    if(word.startsWith(" ")) {
      startsFrom = startsFrom + 1;
      word = word.trim();
    } else if(word.startsWith("\n")) {
      startsFrom = startsFrom + 1;
      word = word.substring(1)
    }
    const tagName = word.startsWith("#") ? "hashtag" : "mention"
    return {word, tagName, startsFrom, endsAt: startsFrom + word.length, index: i}
  })

  return matches || [];
}

function checkHashtagFocused(hashtags) {
  const tagFocused = hashtags.find(tag => {
    if(cursorPosition.start > tag.startsFrom && cursorPosition.end <= tag.endsAt ) return tag
  })
  
  console.log(tagFocused)
  return tagFocused || null;
}

function setTagListPosition(tagList, textarea, setLeft = false) {
  let textareaHeight = textarea.offsetHeight;
  
  let { top, left } = textarea.getBoundingClientRect();

  if(setLeft) {
    tagList.style.left = `${left}px`
  }

  if(textareaHeight > 700) {
    top = 0;
    textareaHeight = 700 + 50;
  }
  tagList.style.top = `${+top + +textareaHeight + 16 + window.scrollY}px`;
  tagList.style.maxHeight = `${cordinates.visibleScreenHeight - tagList.offsetTop - 20 + window.scrollY}px`
}


function createHashTagHtml(tag, originalWord) {
  const {name} = tag;
  const suggestedAutoFill = name.slice(originalWord.length);

  return `<li class="auto-tag-suggestion" data-suggestion="${originalWord}${suggestedAutoFill}" data-original="${originalWord}">
            #${originalWord}<span class="suggest">${suggestedAutoFill}</span>
          </li>`
}

function createMentionHtml(tag, originalWord) {
  const {profilePic, username, firstName, lastName, _id: userId } = tag;

  return `<li class="auto-tag-suggestion user" data-suggestion="${username}" data-user-id="${userId}" data-original="${originalWord}">
            <img class="profileImage" src=${profilePic} />
            <div>
              <p class="suggest">${firstName} ${lastName}</p>
              <p class="muted">@${username}</p>
            </div>
          </li>`
}

function fillAutoSuggestion(e, textarea, tagFocusedData) {
  const {index, endsAt} = tagFocusedData;
  const suggestion = e.target.dataset.suggestion;
  const original = e.target.dataset.original;
  const contentTextarea = textarea.nextElementSibling;
  const userId = e.target.dataset.userId;
  const contentTextareaTarget = contentTextarea.querySelectorAll("span.highlight--blue")[index]
  if(contentTextareaTarget) {
    // just in case check for when a user clicks immediately after removing all tags (there would be no highlight--blue elements[tags]), resulting in an error
    // and 7 un-needed lines 
    contentTextareaTarget.textContent = contentTextareaTarget.textContent.replace(original, suggestion);
    if(userId) {
      contentTextareaTarget.setAttribute("data-user-id", userId);
    }
    textarea.value = contentTextarea.textContent;
    lockedContainer.classList.remove("noPointerEvents");
    lockedContainer = null;
    document.getElementById("tagList").classList.remove("show");
    textarea.selectionStart = endsAt + (suggestion.length - original.length);
    textarea.focus();
    textarea.setAttribute("data-focused", "false")
  }
}

function createTagListEl(textarea, tagListEl, tags) {
  let tagList = tagListEl;
  let {originalTag: {tagName, word, index, endsAt}} = tags;
  word = word.substring(1);
  textarea.setAttribute("data-focused", "true")

  if(!tagList) {
    tagList = document.createElement("ul");
    tagList.id = "tagList";
    document.body.appendChild(tagList)
  }

  
  tagList.innerHTML = "";
  let html = "";
  tags.data.recommendedTags.forEach((tag) => {
    if(tagName === "hashtag") {
       html += createHashTagHtml(tag, word)
    } else {
       html += createMentionHtml(tag, word)
    }
  })

  tagList.insertAdjacentHTML("beforeend", html)
  tagList.querySelectorAll(".auto-tag-suggestion").forEach(s => {
    s.addEventListener("click", e => fillAutoSuggestion(e, textarea, { index, endsAt } ))
  })

  if(lockedContainer === elements.wrapper) {
    tagList.style.zIndex = 100;
  } else {
    tagList.style.zIndex = 1;
  }

  setTagListPosition(tagList, textarea, true)

  tagList.classList.add("show")
}

function setLockedContainer(e) {
  lockedContainer = e.target.closest(".modal") ? elements.wrapper : elements.main;
  lockedContainer.classList.add("noPointerEvents")
}

async function showTagList(e) {
  let {value} = e.target;
  const tagListArr = getTagList(value);

  if(tagListArr.length) {
    const tagFocused = checkHashtagFocused(tagListArr);
    const tagList = document.getElementById("tagList") || null;

    if(tagFocused) {
      setLockedContainer(e)
      const {data: recommendedTags} = await axios.get("/api/posts/tags", {params: tagFocused})
      // tagFocused.word.substring(1)
      // type: tagFocused.tagName
      createTagListEl(e.target, tagList, { data: recommendedTags, originalTag: tagFocused })
    } else {
      console.log("TAGLIST CLOSES")
      closeTagList(tagList)
    }
  } else {
    // should also close if there are no tags
    closeTagList(document.getElementById("tagList"))
  }
  
}

function closeTagList(tagList) {
  if(tagList && tagList.classList.contains("show")) {
    tagList.classList.remove("show")
    lockedContainer.classList.remove("noPointerEvents")
    lockedContainer = null;
  }
}

function closeTagListListener(e) {
  if(lockedContainer && !e.target.classList.contains("auto-tag-suggestion") && e.target.id !== "tagList") {
    closeTagList(document.getElementById("tagList"))
    const txtarea = document.querySelector(".realTextarea[data-focused='true']");
    txtarea.focus();
    txtarea.setAttribute("data-focused", "false")
  }
}


document.body.addEventListener("click", closeTagListListener)

const throttle = (fn, delay) => { 
  // Capture the current time 
  let time = Date.now(); 
 
 
  // Here's our logic 
  return () => { 
    if((time + delay - Date.now()) <= 0) { 
      // Run the function we've passed to our throttler, 
      // and reset the `time` variable (so we can check again). 
      fn(); 
      time = Date.now(); 
    } 
  } 
} 

let tagsTimer;
export async function lastKey(e) {
  clearTimeout(tagsTimer);

  tagsTimer = setTimeout(async () => {
    cursorPosition = getCursorPos(e.target);
    await showTagList(e)
  }, 500)
  
}


window.addEventListener("click", async e => {
  if(e.target.classList.contains("realTextarea")) {
    cursorPosition = getCursorPos(e.target);
    await showTagList(e)
  }
})

function retrieveHashtagsAndMentions(text, contentTextarea) {
  

  return [...text.matchAll(hashOrMentionRegex)]?.reduce((acc, match, index) => {
    console.log("mah match", match)
    const word = match[0]
    const category = word.includes("@") ? "mentions" : "hashTags"
    let tagData = {};

    if(category === "mentions") {
      const mentionEl = contentTextarea.querySelectorAll("span.highlight--blue")[index];
      if(mentionEl.dataset.userId) {
        tagData.userId = mentionEl.dataset.userId;
      }
    }

    if(word.startsWith(" ") || word.startsWith("\n")) {
      console.log(word.substring(1, 2))
      tagData.name = word.substring(2);
    } else {
      console.log(console.log(word.substring(0, 1)))
      tagData.name = word.substring(1)
    }


    return {...acc, [category]: [...acc[category] || [], category === "mentions" ? tagData : tagData.name]}
  }, {
    hashTags: [],
    mentions: []
  })


  // return [...text.matchAll(hashOrMentionRegex)]?.map((match, index) => {
  //   let word = match[0];
  //   const tagsData = {};
    
  //   if(word.includes("@")) {
  //     const mentionEl = contentTextarea.querySelectorAll("span.highlight--blue")[index];
  //     if(mentionEl.dataset.userId) {
  //       tagsData.userId = mentionEl.dataset.userId;
  //     }
  //   }
    

  //   if(word.startsWith(" ") || word.startsWith("\n")) {
  //     console.log(word.substring(1, 2))
  //     tagsData.word = word.substring(2);
  //   } else {
  //     console.log(console.log(word.substring(0, 1)))
  //     tagsData.word = word.substring(1)
  //   }

  //   return tagsData;
  // }) || [];
}

// TAGS END //

export const postCharactersLimit = 210;
export function onInput(textarea, limit) {
  let value = textarea.value;
  const form = textarea.parentElement.parentElement;
  
  const contentEditable = textarea.nextElementSibling;
  adjustTextareaHeight(textarea, contentEditable);
  contentEditable.innerHTML = value.replace(hashOrMentionRegex, `$1<span class='highlight--blue'>$2</span>`);

  // disable button
  const submitButton = form.querySelector(".btn-submit");
  submitButton.disabled = value.trim() === "" && !form.querySelector(".postMediaPreview").childElementCount || value.length > limit;

  // mark if > than limit
  markIfOverLimit(value, limit, contentEditable);

  // circle
  const { lettersRemaining, perimeter, reduceDashOffset, letters, coloredCircle, letterCounterSVG, lettersCounterContainer, lettersRemainingSpan } = getKeyAttributes(textarea, form, limit);
  showCounter(lettersCounterContainer, letters);
  strokeColor(coloredCircle, lettersRemaining);
  setLettersCounterSVG(letterCounterSVG, lettersRemaining, coloredCircle);
  showLettersRemaining(lettersRemaining, lettersRemainingSpan);
  calculateDashoffset(coloredCircle, perimeter, letters, reduceDashOffset);
}

function GIFMedia(gif) {
  let media = []
  const { url, images: {downsized_still, downsized}, mediaType, title, user } = gif;

  [downsized_still, downsized].forEach(image => {
    media.push({
      originalname: title,
      mimetype: "image/gif",
      credits: {
      via: url,
      creator_name: user?.display_name,
      creator_profile: user?.profile_url,
      is_verified: user?.is_verified,
      creator_avatar: user?.avatar_url
    },
    path: image.url,
    size: image.size,
    mediaType
    })
  })

  return media;
}

function createPostMedia(e, filesUploaded) {
  let media = [];
  const hiddenInput = e.target.querySelector('input[type="hidden"]');

  console.log("CREATING POST MEDIA")

  if(hiddenInput.value.length) {
    console.log("if")
    const GIF = JSON.parse(hiddenInput.value);
    media = GIFMedia(GIF)
  } else if(Object.keys(filesUploaded).length) {
    console.log("else")
    media = Object.values(filesUploaded)
  }

  return media;
}

function hideReplyForm() {
  document.getElementById("replyModal").classList.remove("show");
  document.body.classList.remove("lock");
}

function insertPost(post) {
  let html = createPostHtml(post);

  postsContainer.insertAdjacentHTML("afterbegin", html);

  const pathname = window.location.pathname.split("/").filter(path => path !== "");
  console.log(pathname, post.replyTo);

  if(pathname[0] === "posts" && post.replyTo?._id == pathname[1]) {
    const postEl = document.querySelector(`.postContainer[data-post-id="${post._id}"]`);
    postsContainer.insertBefore(postEl, postsContainer.querySelector(".postContainer:nth-of-type(4)"))
  }
}

function postLoadingBar(e, mediaSelection) {
  const appendTo = e.target.closest(".modal-container") ? e.target.closest(".modal-container").querySelector(".modal-header") : e.target.closest(".postContainer");
  createLoadingBar(appendTo);

  setInitialTextareaState(e, mediaSelection);
}

function updateReplyCount(post) {
  if(post.replyTo) {
    const postEl = document.getElementById(post.replyTo._id);
    if(postEl) {
      const replyButton = postEl.querySelector(".btn-block.reply")
      countOperations(replyButton, post.replyTo.replyCount);
      toggleActive(replyButton, post.replyTo.replyCount);
    }
  } 
}

export const submitPost = async (e, mediaSelection, setPosts, limit, additionalCallback) => {
  e.preventDefault();
  const textarea = e.target.querySelector(".realTextarea");
  if(textarea.value.length > limit) return;
  const submitBtn = e.target.querySelector(".btn-submit");
  submitBtn.disabled = true;

  try {
    const { hashTags, mentions } =  retrieveHashtagsAndMentions(textarea.value, textarea.nextElementSibling);

    console.log(mentions);
    const data = {
      content: textarea.value,
      hashTags,
      mentions,
      media: createPostMedia(e, mediaSelection.filesUploaded)
    }

    if(data.media.length && data.media[0].mediaType !== "GIF") {
      postLoadingBar(e, mediaSelection)
    }
    const replyToId = e.target.getAttribute("data-replyid");
    if(replyToId) {
      data.replyTo = replyToId
    }


    console.log("THIS SUCKS")
    const {data: newPost} = await axios.post("/api/posts", data);
    setPosts({[newPost._id]: newPost})

    insertPost(newPost);
    if(!data.media.length || data.media[0].mediaType == "GIF") {
      setInitialTextareaState(e, mediaSelection);
    }
    updateReplyCount(newPost);
    if(additionalCallback) {
      additionalCallback();
    }
  } catch(error) {
    console.log("THIS ERROR SUCKS MY BALLS OFF MAN")
    console.error(error)
  } finally {
    document.querySelector(".loadingBar")?.remove();
  }
  
}



window.addEventListener("scroll", throttle(e => {
  const tagList = document.getElementById("tagList") || null;
  // if it aint declared here it will be null outside, because initially, it doesn't exist
  if(tagList && tagList.classList.contains("show")) {
    

    if(initialTagListDistanceFromTop + tagList.offsetHeight > cordinates.visibleScreenHeight - window.scrollY) {
      console.log(initialTagListDistanceFromTop + tagList.offsetHeight + window.scrollY - cordinates.visibleScreenHeight)
      tagList.style.maxHeight = `${initialTagListDistanceFromTop + window.scrollY - cordinates.visibleScreenHeight}px`
    } else {
      // tagList.style.minHeight = `${cordinates.visibleScreenHeight - initialTagListDistanceFromTop + tagList.offsetHeight + window.scrollY}px`
      // tagList.style.minHeight = `${cordinates.visibleScreenHeight - initialTagListDistanceFromTop + tagList.offsetHeight + window.scrollY}px`
      // console.log("Its not currently", initialTagListDistanceFromTop + tagList.offsetHeight)
    }

    // console.log(window.scrollY + tagList.offsetHeight + initialTagListDistanceFromTop, cordinates.visibleScreenHeight, window.scrollY + tagList.offsetHeight + initialTagListDistanceFromTop > cordinates.visibleScreenHeight, cordinates.visibleScreenHeight, window.scrollY);
  }
}, 500))


export function createPostForm(formId, setPosts) {
  const form = document.getElementById(formId);
  const mediaButton = form.querySelector(`.btn-icon[data-title="Media"]`);
  const postFormSubmitButton = form.querySelector(".btn-submit");
  const postPreviewContainer = form.querySelector(".postMediaPreview")
  const textarea = form.querySelector(".realTextarea");

  Dropzone.autoDiscover = false;
  const mediaSelection = new UploadPostMedia(mediaButton, {
    url: "/uploads/dropzone/post",
    previewsContainer: postPreviewContainer,
    previewTemplate: uploadPostMediaTemplate,
    paramName: "files",
    uploadMultiple: true,
    parallelUploads: 4,
    acceptedFiles: ".png, .jpg, .jpeg, video/*",
    maxFiles: 4,
    maxFilesize: 72
  }, postFormSubmitButton)

  new EmojiSelection(form.querySelector(".btn-icon[data-title='Emoji']"), crypto.randomUUID(), textarea, true, {value: postCharactersLimit, callback: () => onInput(textarea, postCharactersLimit)});

  textarea.addEventListener("blur", async () => {
    if(!Object.keys(mediaSelection.filesUploaded).length) {
      await axios.delete(`/uploads/deleteTempUserFiles/${userLoggedIn._id}`);
    }
  })
  textarea.addEventListener("keyup", lastKey);
  textarea.addEventListener("input", (e) => onInput(e.target, postCharactersLimit));
  form.addEventListener("submit", async (e) => {
    const additionalCallack = formId == "reply" ? hideReplyForm : null;
    await submitPost(e, mediaSelection, setPosts, postCharactersLimit, additionalCallack);
  });

  return {mediaSelection}
}

