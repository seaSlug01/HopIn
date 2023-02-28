import {elements, docReady, getScrollbarWidth, spinnerV2} from "./common.js";
import { openModal, setInitialModalTarget, closeModal, closingModalInitialState } from "./modal.js"


const giphyButtons = document.querySelectorAll(".giphy");
const modalBody = elements.giphyModal.querySelector(".modal-body");
const toggleAnimationBtn = elements.giphyModal.querySelector(".toggler");
const searchInput = elements.giphyModal.querySelector("input");
const searchResetButton = elements.giphyModal.querySelector(".modal-header__search__reset");
const searchLabel = searchInput.nextElementSibling;

// State variables
let modalBodyWidth = (modalBody.offsetWidth - getScrollbarWidth()) / 16;
let animateGIFS = true
const initialGIFState = {
  trending: {},
  search: {}
}
let GIFS = initialGIFState;
let giphySearchOffset = 0;
let gridStart = 0;
let formTarget = null;
let searchTimer = null;

const asyncGIFsCallback = async (callback) => {
  if(!modalBody.querySelector(".messages-loading-spinner")) {
    spinnerV2(modalBody)
  }

  try {
    await callback();
  } catch(error) {
    console.log(error);
  } finally {
    modalBody.querySelector(".messages-loading-spinner")?.remove();
  }
}

const searchGIFs = async (searchTerm, offset) => {
  const {data: {GIFS: giphyResponse}} = await axios.get(`/api/giphy/search/${searchTerm.trim()}`, {params: {offset}});
  if(offset === 0) {
    GIFS["search"] = {}
  }
  displayGIFs(giphyResponse, "search", false)
  giphySearchOffset = offset + giphyResponse.length;
  console.log(GIFS)
}

function resetSearchInput() {
  searchInput.value = "";
  searchInput.blur();
  searchLabel.querySelector("span").textContent = "Search for GIFs";
}

docReady(() => {
  toggleAnimationBtn.setAttribute("data-toggle", animateGIFS)
})



function setGIFSrc(animation) {
  const category = searchInput.value.length ? "search" : "trending"
  for(let id of Object.keys(GIFS[category])) {
    const gif = GIFS[category][id];
    const {url} = animation ? gif.images.original : gif.images.original_still;

    const image = document.getElementById(id).querySelector("img");
    image.src = url;
  }
}

function createGif(gif, totalEmAdded) {
  const gap = 0.2
  const {url, width} = animateGIFS ? gif.images.original : gif.images.original_still;
  let divisionPoints = window.matchMedia('(max-width: 600px)').matches ? 3.5 : 2.5;
  let containerWidth = (width / divisionPoints) / 16;

  if(modalBodyWidth - (totalEmAdded + containerWidth) < 10) {
    containerWidth = modalBodyWidth - totalEmAdded;
    totalEmAdded = 0;
  } else if(totalEmAdded + containerWidth > modalBodyWidth) {
    containerWidth = modalBodyWidth - totalEmAdded;
    totalEmAdded = 0;
  } else {
    totalEmAdded = totalEmAdded + containerWidth + gap
  }

  const template =  `<div id="${gif.id}" class="modal-body__GIF" style="width: ${containerWidth}em;">
                        <img src="${url}" alt="${gif.title}" />
                      </div>`

  return { template, totalEmAdded }
}

function displayGIFs(gifsData, category, deletePrev = false) {
  if(deletePrev) {
    modalBody.innerHTML = "";
  }
  
  let html = "";
  gifsData.forEach(gif => {
    if(category) {
      GIFS[category] = {...GIFS[category], [gif.id]: gif}
    }
    const {template, totalEmAdded} = createGif(gif, gridStart);
    gridStart = totalEmAdded;
    html += template
  })
  modalBody.insertAdjacentHTML("beforeend", html);
}

async function getTrending() {
  const response = await axios.get(`/api/giphy/trending`);
  displayGIFs(response.data.GIFs, "trending", true)
}

giphyButtons.forEach(btn => {

  btn.addEventListener("click", async (e) => {
    formTarget = e.target.getAttribute("data-target");
    openModal(elements.giphyModal);

    await asyncGIFsCallback(() => getTrending())
  });

})

function gifWidth(gif, totalEmAdded) {
  
  const el = document.getElementById(gif.id)
  if(el) {
    const min = 8
    const max = 16
    const gap = 0.2
    const {width} = animateGIFS ? gif.images.downsized_small : gif.images.downsized_still;
    let divisionPoints = window.matchMedia('(max-width: 600px)').matches ? 3.5 : 2.5;
    let containerWidth = (width / divisionPoints) / 16;

    if(containerWidth > max) {
      containerWidth = max;
    } else if(containerWidth < min) {
      containerWidth = min;
    }

    if(totalEmAdded + containerWidth < modalBodyWidth) {
      if(totalEmAdded + containerWidth + min + gap > modalBodyWidth) {
        containerWidth = modalBodyWidth - totalEmAdded;
        totalEmAdded = 0
      } else {
        totalEmAdded = totalEmAdded + containerWidth + gap;
      }
    } else if(totalEmAdded + containerWidth + gap > modalBodyWidth) {
      console.log('else if')
      containerWidth = modalBodyWidth - totalEmAdded;

      totalEmAdded = 0;
    } else {
      console.log("else")
      totalEmAdded = totalEmAdded + containerWidth + gap;
    }

    el.style.width = `${containerWidth}em`;

    return { totalEmAdded }
  }

  return { totalEmAdded: 0 }
}

function adjuctGIFsWidth(gifs) {
  gifs.length && gifs.forEach(gif => {
    const {totalEmAdded} = gifWidth(gif, gridStart);
    gridStart = totalEmAdded;
  })
}

const observeGIFModalHeight = new ResizeObserver((entries) => {
  const elementWidth = entries[0].contentRect.width;
  modalBodyWidth = elementWidth / 16;
  gridStart = 0;
  const gifBatch = searchInput.value.length ? GIFS['search'] : GIFS["trending"]
  console.log("hereee", gifBatch, Object.entries(gifBatch).length, searchInput.value.length ? "search" : "trending")
  adjuctGIFsWidth(Object.values(gifBatch))
})

const resetGIFModalState = () => {
  modalBody.innerHTML = "";
  searchResetButton.classList.add("d-none");
  resetSearchInput()
  giphySearchOffset = 0;
  GIFS = initialGIFState;
  formTarget = null;
  gridStart = 0;
}

function saveGIFDetailsToHiddenInput(postForm, gifSelected) {
  const type = gifSelected.type;
  delete gifSelected.type;
  gifSelected.mediaType = type.replace("image/", "").toUpperCase();
  const hiddenInput = postForm.querySelector("input[type='hidden']");
  hiddenInput.value = JSON.stringify(gifSelected);
}

function createGifPreview(postForm, gifSelected) {
  const mediaPreviewEl = postForm.querySelector(".postMediaPreview");
  mediaPreviewEl.classList.add("active");

  mediaPreviewEl.innerHTML = `<div class="postMediaPreview__item postMediaPreview__item__GIF">
                                <button class="postMediaPreview__item__close-icon" type="button">&#10005;</button>
                                <div class="postMediaPreview__item__wrapper" show-play="true">
                                  <img src="${gifSelected.images.downsized_still.url}" alt="${gifSelected.title}" playing="false" />
                                </div>
                                <p class="postMediaPreview__item__mentions muted">via <a href="${gifSelected.url}" target="_blank">GIPHY</a></p>
                              </div>`
}

function selectGIF(e) {
  if(e.target.classList.contains("modal-body__GIF")) {
    const category = searchInput.value.length ? "search" : "trending";
    const gifId = e.target.id;

    const gifSelected = GIFS[category][gifId];
    
    const postForm = document.getElementById(formTarget);
    postForm.querySelector(".btn-icon.dz-clickable").disabled = true;
    postForm.querySelector(".btn-submit").disabled = false;
    saveGIFDetailsToHiddenInput(postForm, gifSelected);
    createGifPreview(postForm, gifSelected)

    closingModalInitialState(elements.giphyModal)
    resetGIFModalState()
    console.log(gifSelected)
  }
}

const toggleSelectedGIFPreview = (e) => {
  if(e.target.closest(".postMediaPreview__item__GIF")) {
    console.log(e.target);
    const previewEl = e.target.closest(".postMediaPreview__item__wrapper") ? e.target.closest(".postMediaPreview__item__wrapper") : e.target;
    const img = previewEl.querySelector("img");
    let isPlaying = img.getAttribute("playing");
    
    const hiddenInput = e.currentTarget.previousElementSibling;
    const gifData = JSON.parse(hiddenInput.value);
    

    img.src = isPlaying == "true" ? gifData.images.downsized_still.url : gifData.images.downsized.url;

    img.setAttribute("playing", isPlaying == "true" ? false : true);

    previewEl.setAttribute("show-play", isPlaying == "true" ? true : false);
  }
}

const removeSelectedGIFPreview = e => {
  const GIFPreview = e.target.closest(".postMediaPreview__item__GIF");
  if(e.target.classList.contains("postMediaPreview__item__close-icon") && GIFPreview) {
    const previewContainer = GIFPreview.parentElement
    const hiddenInput = previewContainer.previousElementSibling;
    hiddenInput.value = "";
    previewContainer.classList.remove("active");
    GIFPreview.remove();

    const postForm = e.currentTarget.closest(".postForm");
    const addMedia = postForm.querySelector(".btn-icon.dz-clickable")
    const textarea = postForm.querySelector(".realTextarea");
    
    addMedia.disabled = false;
    
    if(!textarea.value.length) {
      const btnSubmit = postForm.querySelector(".btn-submit");
      btnSubmit.disabled = true;
    }
  }
}


// LISTENERS
document.querySelectorAll(".postMediaPreview").forEach(previewEl => {
  previewEl.addEventListener("click", toggleSelectedGIFPreview)
  previewEl.addEventListener("click", removeSelectedGIFPreview);
})

modalBody.addEventListener("click", selectGIF)

observeGIFModalHeight.observe(elements.giphyModal.querySelector(".modal-body"))
elements.giphyModal.addEventListener("mousedown", setInitialModalTarget)
elements.giphyModal.addEventListener("mouseup", (e) => closeModal(e, null, resetGIFModalState))

searchResetButton.addEventListener("click", e => {
  e.target.classList.add("d-none");
  resetSearchInput()
  giphySearchOffset = 0;
  GIFS["search"] = {}
  gridStart = 0;
  displayGIFs(Object.values(GIFS["trending"]), "trending", true)
})

searchInput.addEventListener("keyup", e => {
  clearTimeout(searchTimer)

  if(e.target.value.length > 0) {
    searchLabel.querySelector("span").textContent = e.target.value;
    searchResetButton.classList.remove("d-none")
  } else {
    searchLabel.querySelector("span").textContent = "Search for GIFs"
    gridStart = 0;
    displayGIFs(Object.values(GIFS["trending"]), null, true)
    searchResetButton.classList.add("d-none")
  }

  searchTimer = setTimeout(async () => {
    if(e.target.value !== "") {
      modalBody.innerHTML = ""
      gridStart = 0;
      await asyncGIFsCallback(() => searchGIFs(e.target.value, 0))
    }
    
  }, 500)
})

modalBody.addEventListener("scroll", _.throttle(async e => {
  if(e.target.scrollTop > e.target.scrollHeight - e.target.offsetHeight - 10) {
    
    if(searchInput.value.length) {
      console.log(" the element reachez bottom hahaha", gridStart)
      await asyncGIFsCallback(() => searchGIFs(searchInput.value, giphySearchOffset))
    }
  }
}, 500))

toggleAnimationBtn.addEventListener("click", (e) => {
  animateGIFS = !animateGIFS;
  e.target.setAttribute("data-toggle", animateGIFS)
  setGIFSrc(animateGIFS)
})




