import { setInitialModalTarget, closeModal, wrapperPadding } from "./modal.js"
import { Range } from "./customRangeInput.js";
import { spinnerV2, getScrollbarWidth } from "./common.js";

// 3 pages will have media selection
// home / postPage / profilePage

// home will definately have postMediaSelection and replyMediaSelection
// postPage may have postMediaSelection but surely replyMediaSelection
// profilePage will only have replyMediaSelection

// function convertToArray(object) {
//   const arr = [];
//     for(let uuid of Object.keys(object)) {
//       let objectVal = object[uuid];
//       arr.push({...objectVal, uuid})
//     }

//     return arr;
// }

const zoomIcons = [
  {
    name: "zoomMinus",
    svg: `<svg width="100%" height="100%" viewbox="0 0 79 79" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="Group 3">
                <circle id="Ellipse 1" cx="35" cy="35" r="32" stroke="#2e2e2e" stroke-width="5.5"></circle>
                <path id="Line 1" d="M18.5 35L28.5 35.0001L35 35H51" stroke="#2e2e2e" stroke-width="6"></path>
                <path id="Line 3" d="M59.2021 59.7314L76.4896 76.379" stroke="#2e2e2e" stroke-width="6"></path><i></i>
            </g>
          </svg>`
  },
  {
    name: "zoomPlus",
    svg: `<svg width="100%" height="100%" viewbox="0 0 79 79" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="Group 1">
                <circle id="Ellipse 1" cx="35" cy="35" r="32" stroke="#2e2e2e" stroke-width="5.5"></circle>
                <path id="Line 1" d="M21.5 35L28.5 35.0001L35 35L47.5 35.0001" stroke="#2e2e2e" stroke-width="6"></path>
                <path id="Line 2" d="M34.8677 47.1345L34.7575 22.9686" stroke="#2e2e2e" stroke-width="6"></path>
                <path id="Line 3" d="M59.2021 59.7314L76.4896 76.379" stroke="#2e2e2e" stroke-width="6"></path>
            </g>
          </svg>`
  }
]

class MediaSettingsUtils {
  convertToArray(object) {
    const arr = [];
      for(let uuid of Object.keys(object)) {
        let objectVal = object[uuid];
        arr.push({...objectVal, uuid})
      }
  
      return arr;
  }

  lockBody() {
    wrapperPadding(getScrollbarWidth())
    document.body.classList.add("lock")
  }

  createElement(classList, tag = "div") {
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

  closeIcon() {
    const closeIcon = document.createElement("button");
    const closeIconClassList = ["modal-close", "round", "btn-icon"];
    closeIcon.classList.add(...closeIconClassList);
    closeIcon.setAttribute("data-title", "Back");
    closeIcon.setAttribute("data-toggle", "tooltip");
    return closeIcon;
  }

  setTabHeader() {
    const tabHeaders = {
      crop: "Crop media",
      alt: "Edit image description",
      sensitiveContent: "Content warning",
      caption: "Upload captions"
    }

    this.modal.querySelector(".modal-header__text").textContent = tabHeaders[this.activeTab]
  }

  createTabs(tabs) {
    // later will change
    const tabsContainer = this.createElement(["tabsContainer", "sticky"], "ul");

    tabs.forEach(tab => {
      const tabEl = document.createElement("li");
      tabEl.classList.add("tab-item");

      const tabLink = document.createElement("span");
      tabLink.classList.add("tab-link");
      tabLink.setAttribute("data-tab", tab.data)
      if(tab.data === this.activeTab) tabLink.classList.add("active")

      const textEl = document.createElement("span");
      textEl.innerHTML = tab.innerHTML;
     
      tabLink.appendChild(textEl)
      tabEl.appendChild(tabLink);
      tabsContainer.appendChild(tabEl);
    })

    return tabsContainer;
  }

  searchObj(obj, returnProp) {
    return obj ? obj[returnProp] ?? null : null;
  }

  createHeader(submitButtonText) {
    const modalHeader = this.createElement(["modal-header", "sticky"]);

    const headerText = this.createElement("modal-header__text", "h3")
    const saveButton = this.createElement("btn-black", "button")
    saveButton.textContent = submitButtonText;

    [this.closeIcon(), headerText, saveButton].forEach(el => modalHeader.appendChild(el));
    return modalHeader;
  }

  headerSpinner() {
    const container = this.createElement("messages-loading-spinner", "div");
    const spinner = this.createElement("message-spinner", "div");
    container.appendChild(spinner);

    const header = this.modal.querySelector(".modal-header");
    header.insertBefore(container, header.querySelector(".btn-black"));
    gsap.fromTo(spinner, {rotate: 0}, { rotate: 350, duration: 1, ease: "slow(0.7, 0.7, false)", repeat: -1 })
  }


  createSensitiveContentCategoryCheckboxes(container) {
    const checkboxesContainer = this.createElement("modal-footer__checkboxes");

    
    ["Nudity", "Violence", "Sensitive"].forEach(headline => {
      const checkBoxContainer = this.createElement("modal-footer__checkboxes__checkboxContainer");
      checkBoxContainer.setAttribute("data-category", headline.toLowerCase())

      const header = this.createElement("modal-footer__checkboxes__checkboxContainer__desc", "p")
      header.textContent = headline;

      const checkbox = this.createElement("", "input");
      checkbox.setAttribute("type", "checkbox");
      checkbox.checked = this.searchObj(this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent, headline.toLowerCase()) ?? false

      
      
      checkboxesContainer.appendChild(checkBoxContainer);
      [header, checkbox].forEach(el => checkBoxContainer.appendChild(el))
    })

    container.appendChild(checkboxesContainer)

    if(this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent !== undefined && Object.keys(this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent).length) {
      this.createOverlay()
    }

    // time for the listener
    checkboxesContainer.addEventListener("click", (e) => {
      if(e.target.dataset.category) {
        const category = e.target.dataset.category;
        const inputCheckbox = e.target.querySelector("input");
        const categoryChecked = this.searchObj(this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent, category)
        if(categoryChecked) {
          delete this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent[category]
          inputCheckbox.checked = false;
        } else {
          this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent = {...this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent, [category]: true};
          inputCheckbox.checked = true;
        }

        this.setSensitiveOverlay();
      }
    })
  }

  setContentWarningText() {
    return Object.keys(this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent).map((category, i, arr) => {
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

  createOverlay() {
    const overlay = this.createElement("overlay");

    const container = this.createElement("overlay__info");

    this.modal.querySelector(".modal-body").appendChild(overlay);
    overlay.appendChild(container);

    const icon = this.createElement("overlay__info__icon");
    icon.innerHTML = '<i class="fa-solid fa-eye-slash"></i>'
    const heading = this.createElement("overlay__info__heading", "p");
    heading.innerHTML = `Content warning: <span>${this.setContentWarningText()}</span>`
    const subHeading = this.createElement("overlay__info__subHeading", "p");
    subHeading.textContent = "The author flagged this post as showing sensitive content."
    const show = this.createElement(["overlay__info__action", "btn-rounded"], "button");
    show.textContent = "Show"

    show.addEventListener("click", () => overlay.classList.add("d-none"))

    container.appendChild(icon)
    container.appendChild(heading)
    container.appendChild(subHeading)
    container.appendChild(show)

    const hideOverlay = this.createElement(["btn-rounded", "hide-overlay"], "button");
    hideOverlay.textContent = "Hide";
    this.modal.querySelector(".modal-body").appendChild(hideOverlay);

    hideOverlay.addEventListener("click", () => overlay.classList.remove("d-none"))
  }

  setSensitiveOverlay() {
    const sensitiveContent = this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent;

    const overlay = this.modal.querySelector(".modal-body .overlay")

    if(Object.keys(sensitiveContent).length) {
      if(!overlay) {
        return this.createOverlay();
      }

      overlay.querySelector(".overlay__info__heading span").textContent = this.setContentWarningText()
    } else {
      this.modal.querySelector(".modal-body .hide-overlay").remove();
      overlay.remove();
    }

  }

  createModal(id) {
    const modal = this.createElement("modal");
    modal.id = id;

    return modal;
  }

  createPrompt(tabs, submitButtonText) {
    const modal = this.createModal("mediaSettings");
    this.modal = modal;
    const modalClassList = ["show"];
    modal.style.zIndex = 100;
    const activeModal = document.querySelector(".modal.show");
    if(activeModal) {
      modal.style.zIndex = 101;
      modalClassList.push("bg-transparent");
    }
    modal.classList.add(...modalClassList);

    const modalContainer = this.createElement("modal-container")

    const wrapperScroll = this.createElement("wrapperScroll");
    modalContainer.appendChild(wrapperScroll);

    modal.appendChild(modalContainer);

    const modalHeader = this.createHeader(submitButtonText);
    wrapperScroll.appendChild(modalHeader);
    this.setTabHeader();

    const tabElements = this.createTabs(tabs);
    wrapperScroll.appendChild(tabElements);

    const modalBody = this.createElement("modal-body")
    wrapperScroll.appendChild(modalBody);


    const modalFooter = this.createElement("modal-footer");
    wrapperScroll.appendChild(modalFooter);

    document.body.appendChild(modal);
    this.lockBody();
  }


  addFlagToPreviewItem(previewElement) {
    let button = previewElement.querySelector(".postMediaPreview__item__flag");
    if(button) return
    const actionsContainer = previewElement.querySelector(".postMediaPreview__item__actions");

    button = this.createElement("postMediaPreview__item__flag", "button");
    button.setAttribute("data-tab", "sensitiveContent");
    button.setAttribute("data-target", "mediaSettings");
    button.type = "button";

    const icon = this.createElement(["fa-solid", "fa-flag"], "i");
    button.appendChild(icon)

    actionsContainer.appendChild(button);
  }

  sensitiveContentFooter() {
    const container = this.createElement("modal-footer__container")
    const heading = this.createElement("modal-footer__heading", "p")
    heading.textContent = 'Put a content warning on this post'
    const subHeading = this.createElement(["modal-footer__subHeading",  "muted"], "p")
    subHeading.textContent = "Select a category, and we’ll put a content warning on this post. This helps people avoid content they don’t want to see."


    this.modal.querySelector(".modal-footer").appendChild(container);
    [heading, subHeading].forEach(el => container.appendChild(el))

    this.createSensitiveContentCategoryCheckboxes(container);
  }
}

const tabs = [
  {data: "crop", innerHTML: `<i class="fa-solid fa-crop"></i>`},
  {data: "alt", innerHTML: "ALT"},
  {data: "sensitiveContent", innerHTML: `<i class="fa-solid fa-flag"></i>`},
  {data: "caption", innerHTML: `<i class="fa-solid fa-closed-captioning"></i>`}
]

export class VideoSettings extends MediaSettingsUtils {
  constructor(mediaSelection, videoId, selectedTab, form) {
    super();
    this.form = form;
    this.modal = null;
    this.filesUploadedCopy = JSON.parse(JSON.stringify(mediaSelection.filesUploaded))
    this.selectedMedia = {...mediaSelection.filesUploaded[videoId], uuid: videoId};
    this.activeTab = selectedTab;
    this.dropzone = null;


    this.createPrompt([tabs[3], tabs[2]], "Done");
    this.#displaySelectedTab()

    this.modal.querySelector(".tabsContainer").addEventListener("click", async (e) => {
      const prevActiveTab = e.currentTarget.querySelector(".active");
      if(prevActiveTab === e.target) return;
      const prevActiveTabName = prevActiveTab.dataset.tab;

      prevActiveTab.classList.remove("active");
      e.target.classList.add("active")
      

      this.activeTab = e.target.dataset.tab;
      this.#displaySelectedTab(prevActiveTabName)
    })

    this.modal.addEventListener("mousedown", setInitialModalTarget)
    this.modal.addEventListener("mouseup", e => closeModal(e, this.modal, () => {
      if(this.filesUploadedCopy[this.selectedMedia.uuid].subs) {
        mediaSelection.filesUploaded[this.selectedMedia.uuid].subs = this.filesUploadedCopy[this.selectedMedia.uuid].subs
      }

      console.log("Subz", mediaSelection.filesUploaded[this.selectedMedia.uuid].subs)
      this.addOrRemoveTrackToPreview();

      this.modal.remove()
    }))

    this.modal.querySelector(".modal-header .btn-black").addEventListener("click", async (e) => {
      if(this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent && Object.keys(this.filesUploadedCopy[this.selectedMedia.uuid].sensitiveContent).length) {
        this.addFlagToPreviewItem(this.form.querySelector(`.postMediaPreview__item[data-media-id="${this.selectedMedia.uuid}"]`));
      } else {
        this.form.querySelector(`.postMediaPreview__item[data-media-id="${this.selectedMedia.uuid}"] .postMediaPreview__item__flag`)?.remove();
      }
      this.addOrRemoveTrackToPreview();

      mediaSelection.filesUploaded[this.selectedMedia.uuid] = this.filesUploadedCopy[this.selectedMedia.uuid];
      
      this.modal.remove();
    })
  }

  addOrRemoveTrackToPreview() {
    const video = this.form.querySelector(`.postMediaPreview__item[data-media-id="${this.selectedMedia.uuid}"] video`);
    const track = video.querySelector("track");

    if(this.filesUploadedCopy[this.selectedMedia.uuid].subs) {
      if(track) {
        return track.src = this.filesUploadedCopy[this.selectedMedia.uuid].subs;
      }

      this.#createTrack(video);
    } else {
      track?.remove();
    }
  }

  async #displaySelectedTab() {
    this.modal.querySelector(".modal-body").innerHTML = "";
    this.modal.querySelector(".modal-footer").innerHTML = "";

    switch(this.activeTab) {
      case "caption": 
        this.#createCaptionTab()
        break;
      case "sensitiveContent":
        this.#createSensitiveContentTab();
    }
  }

  #createCaptionTab() {
    console.log("i'LL be da caption")
    const container = this.createElement("container")
    const header = this.createElement("", "h1")
    header.textContent = "Upload caption file (.srt)"

    const subHeader = this.createElement("", "p")
    subHeader.textContent = 'Subtitles and captions can be added to your video by uploading a valid subtitle file. Files must be in the SRT format. Subtitles and captions will be unaffected by video edits.'


    const actionsContainer = this.createElement("container__actions");

    const uploadButtonClasses = ["outline"];
    if(this.filesUploadedCopy[this.selectedMedia.uuid].subs) uploadButtonClasses.push("d-none")
    const uploadSubsButton = this.createElement(uploadButtonClasses, "button")
    uploadSubsButton.type = "button"
    uploadSubsButton.innerHTML = "<i class='fa-solid fa-closed-captioning'></i><span>Upload captions</span>"


    const removeButtonClasses = ["outline", "outline--red"];
    if(!this.filesUploadedCopy[this.selectedMedia.uuid].subs) removeButtonClasses.push("d-none");
    const removeSubsButton = this.createElement(removeButtonClasses, "button")
    removeSubsButton.type = "button"
    removeSubsButton.textContent = "Remove captions";

    removeSubsButton.addEventListener("click", e => {
      delete this.filesUploadedCopy[this.selectedMedia.uuid].subs;
      e.target.classList.add("d-none");
      e.target.previousElementSibling.classList.remove("d-none")
      this.dropzone.removeAllFiles(true)
    })

    Array.from([uploadSubsButton, removeSubsButton]).forEach(action => actionsContainer.appendChild(action))
    Array.from([header, subHeader, actionsContainer]).forEach(el => container.appendChild(el))
    this.modal.querySelector(".modal-body").appendChild(container)

    this.#addDropzoneToButton(uploadSubsButton)
  }

  #addDropzoneToButton(btn) {

    this.dropzone = new Dropzone(btn, {
      url: "/uploads/dropzone/subtitles",
      previewsContainer: false,
      createImageThumbnails: false,
      acceptedFiles: ".srt",
      maxFiles: 1,
      maxFilesize: 1,
      paramName: "file"
    })

    this.dropzone.on("success", async (file, response) => {
      console.log("RESPONSE", response)
      // console.log(this.dropzone.element)
      this.filesUploadedCopy[this.selectedMedia.uuid].subs = response.subs;
      this.dropzone.element.classList.add("d-none");
      this.dropzone.element.nextElementSibling.classList.remove("d-none");
    })
  }

  #createSensitiveContentTab() {
    const mainContentContainer = this.createElement(["modal-body__mainContentContainer", "modal-body__mainContentContainer--sensitiveContent"]);
    const video = this.#createVideoPreview();

    mainContentContainer.appendChild(video)

    this.modal.querySelector(".modal-body").appendChild(mainContentContainer);

    this.sensitiveContentFooter();
  }

  #createTrack(video) {
    const track = document.createElement("track");
    console.log("SUBS PATH", this.filesUploadedCopy[this.selectedMedia.uuid].subs);
    // window.location.origin + `/uploads/files/tmp-userFiles-${userLoggedIn._id}/3_English.vtt`
    track.src = this.filesUploadedCopy[this.selectedMedia.uuid].subs
    track.setAttribute("kind", "subtitles")
    track.setAttribute("srclang", "en")
    track.setAttribute("label", "CC")
    video.appendChild(track)
    video.textTracks[0].mode = "showing"
    console.log(video.textTracks)
  }

  #createVideoPreview() {
    const video = this.createElement("video-js", "video");
    video.setAttribute('controls', "controls");
    video.setAttribute("preload", "none");
    video.setAttribute("poster", this.selectedMedia.thumbnail);
    video.setAttribute("crossorigin", "anonymous");
    video.muted = true;
    // video.src = this.filesUploadedCopy[this.selectedMedia.uuid].path;


    const source = this.createElement("", "source");
    source.src = this.filesUploadedCopy[this.selectedMedia.uuid].path;
    source.type = this.filesUploadedCopy[this.selectedMedia.uuid].mimetype;
    video.appendChild(source)


    if(this.filesUploadedCopy[this.selectedMedia.uuid].subs) {
      this.#createTrack(video);
    }

    video.addEventListener('ended', function(){
      // Reset the video to 0
      video.currentTime = 0;
      // And play again
      video.play();
    });

    return video;
  }
}

export class ImageSettings extends MediaSettingsUtils {
  constructor(mediaSelection, selectedMediaId, selectedTab, form) {
    super();
    this.form = form;
    this.modal = null;
    this.filesUploadedArr = this.convertToArray(mediaSelection.filesUploaded);
    console.log(this.filesUploadedArr)
    // the copy will not affect the real filesUploaded
    // so you can keep the new stuff added to each file
    // like crop cordinates, new cropped image path, alt and sensitive content
    // if you hit the save, you can push them to the real files
    this.filesUploadedCopy = JSON.parse(JSON.stringify(mediaSelection.filesUploaded))
    this.selectedMedia = {...mediaSelection.filesUploaded[selectedMediaId], uuid: selectedMediaId};
    this.activeTab = selectedTab;
    this.cropper = null;
    this.croppedImagesCordinates = {}
    this.range = null;

    console.log(this.filesUploadedCopy)

    this.createPrompt(tabs.slice(0, 3), "Save");
    this.#createImageSelectionButtons(this.modal.querySelector(".modal-header"))

    // original function is async but here, I won't need await
    // since the await is used to crop an image
    // and I'm not cropping anything the moment I open the settings
    // switching from "crop" tab to any other tab(alt tags, sensitive content) would require to "await" for a crop to occur
    // and I don't do that here
    // await keyword can't be used inside a constructor so....  
    this.#displaySelectedTab(null);

    

    this.modal.querySelector(".modal-header .btn-black").addEventListener("click", async (e) => {
      mediaSelection.filesUploaded = this.filesUploadedCopy;

      this.headerSpinner()
      // this will be the callback
      if(this.activeTab === "crop") {
        e.target.disabled = true;
        e.target.textContent = "Saving";
        if(this.#cropperChanges()) {
          await this.#saveCropData(false)
        }
      }

      for(let itemId of Object.keys(this.filesUploadedCopy)) {
        const item = this.filesUploadedCopy[itemId];
        const formPreviewElement = this.form.querySelector(`.postMediaPreview__item[data-media-id="${itemId}"]`);

        if(item.sensitiveContent && Object.keys(item.sensitiveContent).length) {
          this.addFlagToPreviewItem(formPreviewElement);
        } else {
          formPreviewElement.querySelector(".postMediaPreview__item__flag")?.remove();
        }

        if(item.alt && item.alt.length) {
          this.#addImageDescription(formPreviewElement);
        } else {
          formPreviewElement.querySelector(".alt-flag")?.remove();
        }

        if(item.newPath) {
          formPreviewElement.querySelector("img").src = item.newPath;
        }
      }

      this.modal.remove();
    })


    this.modal.querySelector(".tabsContainer").addEventListener("click", async (e) => {
      const prevActiveTab = e.currentTarget.querySelector(".active")
      if(prevActiveTab === e.target) return
      const prevActiveTabName = prevActiveTab.dataset.tab

      prevActiveTab.classList.remove("active")
      e.target.classList.add("active")
      

      this.activeTab = e.target.dataset.tab
      await this.#displaySelectedTab(prevActiveTabName)
    })


    this.modal.addEventListener("mousedown", setInitialModalTarget)
    this.modal.addEventListener("mouseup", e => closeModal(e, this.modal, () => this.modal.remove()))
  }

  #addImageDescription(previewEl) {
    let button = previewEl.querySelector(".alt-flag");
    if(button) return;
    button = this.createElement("alt-flag", "button");
    button.type = "button";
    button.setAttribute("data-search", this.form.id === "post" ? "postMedia" : "replyMedia");
    button.innerHTML = '<span>ALT</span>'

    previewEl.appendChild(button)
  }

  describeAltUtilityToUsers() {
    const modal = this.createModal("generalInfo")
    modal.classList.add("show");
    modal.style.zIndex = 102;

    const container = this.createElement("modal-container");

    const heading = this.createElement("", "h2");
    heading.textContent = "Adding descriptions";
    const desc = this.createElement("muted", "p");
    desc.textContent = "You can add a description, sometimes called alt-text, to your photos so they’re accessible to even more people, including people who are blind or have low vision. Good descriptions are concise, but present what’s in your photos accurately enough to understand their context."
    const gotIt = this.createElement("btn-black", "button");
    gotIt.textContent = "Got it."
    const closeIcon = this.closeIcon()
    
    container.appendChild(closeIcon)
    container.appendChild(heading)
    container.appendChild(desc)
    container.appendChild(gotIt)

    modal.appendChild(container);
    document.body.appendChild(modal);
    modal.addEventListener("mousedown", setInitialModalTarget)
    modal.addEventListener("mouseup", e => closeModal(e, modal, () => modal.remove()))
    gotIt.addEventListener("mouseup", () => modal.remove())
  }

  #createCropperFooter(footer) {

    zoomIcons.forEach(icon => {
      const iconEl = document.createElement("span");
      iconEl.classList.add(icon.name);
      iconEl.insertAdjacentHTML("beforeend", icon.svg);
      footer.appendChild(iconEl)
    })

    const rangeInputContainer = document.createElement("div");
    rangeInputContainer.id = "cropZoom";

    footer.insertBefore(rangeInputContainer, footer.querySelector(".zoomPlus"));
  }


  #cropperOptions() {
    const newPath = this.filesUploadedCopy[this.selectedMedia.uuid]?.newPath ?? null
    let options = {}

    if(newPath) {
      const {width, height, left, top, zoomRatio, canvasData} =  this.filesUploadedCopy[this.selectedMedia.uuid]

      options = {ready: () => {
        this.cropper.setCropBoxData({
          width,
          height,
          left,
          top
        });

        this.cropper.setCanvasData(canvasData)

        this.range = new Range("cropZoom", this.cropper)
        this.cropper.zoomTo(zoomRatio)

        this.range.setRangeCropperZoom(zoomRatio)
      }}
    } else {
      options = {
        ready: () => {
          this.range = new Range("cropZoom", this.cropper)
        },
        minCropBoxWidth: 350,
        minCropBoxHeight: 175
      }
    }

    return options;
  }

  async #displaySelectedTab(prevTab) {
    switch(this.activeTab) {
      case "crop":
        this.setTabHeader();
        this.modal.querySelector(".modal-body").innerHTML = "";
        this.modal.querySelector(".modal-footer").innerHTML = "";

        this.#createCropperBody(this.modal.querySelector(".modal-body"), this.#cropperOptions());
        this.#createCropperFooter(this.modal.querySelector(".modal-footer"))
        break;
      case "alt":
        await this.#createAltTab(prevTab)
        break;
      case "sensitiveContent":
        await this.#createSensitiveContentTemplate(prevTab)
    }
  }

  async #applyCrop() {

    return new Promise((resolve, reject) => {
      const canvas = this.cropper.getCroppedCanvas();

      if(canvas == null) {
        return reject("Could not get image, make sure its an image file.");
      }

      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("file", blob);
        const response = await axios.post("/uploads/cropper", formData);

        console.log("HERE ", this.filesUploadedCopy[this.selectedMedia.uuid])

        const {path, size, filename, encoding} = response.data;

        return resolve({path, size, filename, encoding})
      }, 'image/jpeg')
    })
    
  }

  #cropperChanges() {
    const {width, height, left, top} = this.cropper.getCropBoxData();
    const {width: imageWidth, naturalWidth} = this.cropper.getImageData();
    const zoomRatio = imageWidth / naturalWidth;
    
    const cropperProperties = {width, height, left, top, zoomRatio}
    console.log("initial");
    if(!this.filesUploadedCopy[this.selectedMedia.uuid].canvasData) {
      return Object.keys(cropperProperties).some(prop => cropperProperties[prop] !== this.filesUploadedCopy[this.selectedMedia.uuid][prop]) 
    }

    console.log("bypasssing if block");

    const canvasData = this.cropper.getCanvasData();

    console.log(Object.keys(cropperProperties).some(prop => cropperProperties[prop] !== this.filesUploadedCopy[this.selectedMedia.uuid][prop]),
    Object.keys(canvasData).some(prop => Math.floor(canvasData[prop]) !== Math.floor(this.filesUploadedCopy[this.selectedMedia.uuid].canvasData[prop])),
    Object.keys(cropperProperties).some(prop => cropperProperties[prop] !== this.filesUploadedCopy[this.selectedMedia.uuid][prop]) || Object.keys(canvasData).some(prop => Math.floor(canvasData[prop]) !== Math.floor(this.filesUploadedCopy[this.selectedMedia.uuid].canvasData[prop]))
    )

    console.log(this.filesUploadedCopy[this.selectedMedia.uuid].canvasData, canvasData, this.filesUploadedCopy[this.selectedMedia.uuid].newPath)
    console.log(width, height, left, top, zoomRatio);
    console.log(this.filesUploadedCopy[this.selectedMedia.uuid].width, this.filesUploadedCopy[this.selectedMedia.uuid].height, this.filesUploadedCopy[this.selectedMedia.uuid].left, this.filesUploadedCopy[this.selectedMedia.uuid].top, this.filesUploadedCopy[this.selectedMedia.uuid].zoomRatio)

    // Math.abs since canvasData can troll me sometimes
    // it might give 44.999993 while I had saved 44.999992
    // so normal equality check can't be trusted
    // but it seems to be consistent with cropBoxData and imageData

    return Object.keys(cropperProperties).some(prop => cropperProperties[prop] !== this.filesUploadedCopy[this.selectedMedia.uuid][prop]) || Object.keys(canvasData).some(prop => Math.abs(canvasData[prop] - this.filesUploadedCopy[this.selectedMedia.uuid].canvasData[prop]) > 1);
  }

  async #saveCropData(showLoading = true, prevTab) {
    try {
      if(showLoading) {
        prevTab === "crop" ? this.headerSpinner() : spinnerV2(this.modal.querySelector(".modal-body"));
      }
      
      const {path: newPath, size, filename, encoding} = await this.#applyCrop();
      const {width, height, left, top} = this.cropper.getCropBoxData();
      const {width: imageWidth, naturalWidth} = this.cropper.getImageData();

      const zoomRatio = imageWidth / naturalWidth;
      
      this.filesUploadedCopy[this.selectedMedia.uuid] = {...this.selectedMedia, width, height, left, top, zoomRatio, newPath, size, filename, encoding, canvasData: this.cropper.getCanvasData()}
      console.log("SAVED", this.filesUploadedCopy[this.selectedMedia.uuid], this.filesUploadedCopy[this.selectedMedia.uuid].newPath)
    } catch(error) {
      console.log(error);
    } finally {
      document.querySelector(".messages-loading-spinner")?.remove();
    }
  }

  async #createSensitiveContentTemplate(prevTab) {
    this.setTabHeader()
    this.modal.querySelector(".modal-body").innerHTML = "";
    this.modal.querySelector(".modal-footer").innerHTML = "";
    if(prevTab === "crop") {
      if(this.#cropperChanges()) {
        await this.#saveCropData();
      }
    }

    const imageContainer = this.createElement(["modal-body__mainContentContainer", "modal-body__mainContentContainer--sensitiveContent"]);
    const image = this.createElement("", "img");
    console.log("after all", this.filesUploadedCopy[this.selectedMedia.uuid].newPath)
    const {path, newPath, width, height} = this.filesUploadedCopy[this.selectedMedia.uuid];
    image.src = newPath ?? path;

    if(newPath) {
      image.style.width = `${width * 0.75}px`
      image.style.height = `${height * 0.75}px`
    }

    imageContainer.appendChild(image)

    this.modal.querySelector(".modal-body").appendChild(imageContainer);

    this.sensitiveContentFooter();
  }

  async #createAltTab(prevTab) {
    this.setTabHeader();
    // if prevTab was crop, cropping should be initiated
    // and this tab should use the cropped image
    this.modal.querySelector(".modal-body").innerHTML = "";
    this.modal.querySelector(".modal-footer").innerHTML = "";
    if(prevTab === "crop") {
      if(this.#cropperChanges()) {
        await this.#saveCropData();
      }
    }

    const imageContainer = this.createElement(["modal-body__mainContentContainer", "modal-body__mainContentContainer--alt"]);
    const image = this.createElement("", "img");
    console.log("after all", this.filesUploadedCopy[this.selectedMedia.uuid].newPath)
    const {path, newPath, width, height} = this.filesUploadedCopy[this.selectedMedia.uuid];
    image.src = newPath ?? path;

    if(newPath) {
      image.style.width = `${width}px`
      image.style.height = `${height}px`
    }
    
    imageContainer.appendChild(image)

    this.modal.querySelector(".modal-body").appendChild(imageContainer);

    // modal footer
    // create Textarea and all all appropriate event listeners dawg
    this.#createTextarea();
  }

  #createTextarea() {
    const textareaContainer = this.createElement(["edit-input-group", "bio"])
    const label = this.createElement("", "label")
    const textarea = this.createElement("", "textarea")
    textarea.setAttribute("autocomplete", "off")
    textarea.id = crypto.randomUUID()
    textarea.value = this.filesUploadedCopy[this.selectedMedia.uuid].alt ?? "";

    label.setAttribute("for", textarea.id)

    const placeholder = this.createElement("placeholder", "span")
    placeholder.textContent = "Description";
    const counter = this.createElement("counter", "span")
    counter.textContent = `${textarea.value.length}/1000`

    if(textarea.value !== "") {
      placeholder.classList.add("shrink")
    }

    [textarea, placeholder, counter].forEach(el => label.appendChild(el))
    textareaContainer.appendChild(label);

    this.modal.querySelector(".modal-footer").appendChild(textareaContainer);

    textarea.addEventListener("keyup", (e) => this.filesUploadedCopy[this.selectedMedia.uuid].alt = e.target.value)

    textarea.addEventListener("input", (e) => {
      if(e.target.value.length > 1000) {
        e.target.value = e.target.value.slice(0, 1000);
      } 
      
      if(e.target.value.length > 0) {
        placeholder.classList.add("shrink")
      }
      counter.textContent = `${e.target.value.length}/1000`

      if(e.target.value.length) {
        e.target.style.height = "auto";
        e.target.style.height = (e.target.scrollHeight)+"px";
      } else {
        e.target.style.height = "auto";
      }
      
    })

    textarea.addEventListener("focus", () => placeholder.classList.add("shrink"))
    textarea.addEventListener("blur", (e) => {
      if(!e.target.value.length) placeholder.classList.remove("shrink")
    })

    setTimeout(() => textarea.focus(), 10)


    const whatsAlt = this.createElement("highlight--blue", "span");
    whatsAlt.textContent = "What is alt text?"
    this.modal.querySelector(".modal-footer").appendChild(whatsAlt);

    whatsAlt.addEventListener("click", () => this.describeAltUtilityToUsers());
  }

  #createCropper(image, options = {}) {
    this.cropper = new Cropper(image, {
      ...options,
      background: false,
      viewMode: 1,
      crop: function(event) {
        // console.log("X", event.detail.x);
        // console.log("Y", event.detail.y);
        // console.log("Scale X", event.detail.scaleX);
        // console.log("Scale Y", event.detail.scaleY);
        // console.log("W", event.detail.width);
        // console.log("H", event.detail.height);
      },
      zoom: (e) => {
        if (e.detail.ratio > 2) {
            e.preventDefault();
            return;
        }
        this.range.setRangeCropperZoom(e.detail.ratio);
      },
      
    });
  }

  #createCropperBody(modalBody, cropperOptions) {
    const imageContainer = document.createElement("form");
    imageContainer.classList.add("modal-body__mainContentContainer");
    imageContainer.classList.add("modal-body__mainContentContainer--crop");


    const image = document.createElement("img");
    image.src = this.selectedMedia.path;
    imageContainer.appendChild(image);

    this.#createCropper(image, cropperOptions);

    modalBody.appendChild(imageContainer);
  }

  getIndex() {
    return this.filesUploadedArr.findIndex(file => file.uuid === this.selectedMedia.uuid);
  }

  #createImageSelectionButtons(modalHeader) {
    if(this.filesUploadedArr.length > 1) {
      const container = document.createElement("div");
      container.classList.add("modal-header__changeSelectedImage");
      const buttons = [];

      for(let i = 0; i < 2; i++) {
        const button = document.createElement("button");
        button.classList.add("btn-round");
        const icon = i === 0 ? '<i class="fa-solid fa-arrow-left"></i>' : '<i class="fa-solid fa-arrow-right"></i>'
        button.innerHTML = icon;

        const selectedItemIndex = this.getIndex();

        if(i === 0) {
          button.setAttribute("data-to", selectedItemIndex - 1);
          if(selectedItemIndex - 1 < 0) {
            button.disabled = true;
          }
        } else {
          button.setAttribute("data-to", selectedItemIndex + 1);
          if(selectedItemIndex + 1 > this.filesUploadedArr.length - 1) {
            button.disabled = true;
          }
        }

        buttons.push(button);
        container.appendChild(button);
      }

      modalHeader.insertBefore(container, modalHeader.lastChild);
      container.addEventListener("click", async (e) => {
        if(e.target.dataset.to) {
          const goToIndex = parseInt(e.target.dataset.to);
          const currentIndex = this.getIndex();
          const selectedItemId = this.filesUploadedArr[goToIndex].uuid;

          if(this.activeTab === "crop") {
            // save crop data before selected media changes
            if(this.#cropperChanges()) {
              await this.#saveCropData(true, this.activeTab);
            }
          }

          this.selectedMedia = this.filesUploadedCopy[selectedItemId];

          // set its id too, cuz it empty 
          this.filesUploadedCopy[selectedItemId].uuid = selectedItemId;

          const direction = goToIndex > currentIndex ? "right" : "left";

          // Whats the direction yo?

          if(direction == "right") {
            buttons[0].disabled = false;
          }
          
          if(direction == "left") {
            buttons[1].disabled = false;
          }

          if(goToIndex + 1 > this.filesUploadedArr.length - 1) {
            buttons[1].disabled = true;
          }

          if(goToIndex - 1 < 0) {
            buttons[0].disabled = true;
          }

          buttons.forEach(btn => {
            const goToIndex = direction == "right" ? parseInt(btn.getAttribute("data-to")) + 1 : parseInt(btn.getAttribute("data-to")) - 1
            btn.setAttribute("data-to", goToIndex)
          })

          await this.#displaySelectedTab()
        }
      })
    }
  }
}

