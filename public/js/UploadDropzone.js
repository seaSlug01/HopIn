import { openModal, setInitialModalTarget, closeModal } from "./modal.js"

export class UploadPostMedia extends Dropzone {
  constructor(element, options, submitButton) {
    super(element, options);
    this.hideInfoMessageTimer = null
    this.filesUploaded = {}
    this.gifsButton = element.closest(".btn-group").querySelector(".btn-icon.giphy");
    this.submitButton = submitButton;
    this.postForm = this.submitButton.closest(".postForm");
    this.postTextarea = this.postForm.querySelector(".realTextarea");
    this.loadingIndicators = {
      line: null,
      number: null,
      heading: null
    }

    this.on("success", async (file, multerResponse) => {
      // sucess will run after ALL the addedFiles are finished
      // goes like follows -> addedFile, addedFile, sucess, sucess
      // not like -> addedFile -> success -> 2nd addedFIle -> 2nd sucess
      this.filesUploaded[file.upload.uuid].mimetype = file.type;
      const fileType = file.type.split("/")[0];
      this.filesUploaded[file.upload.uuid].mediaType = fileType;
      this.filesUploaded[file.upload.uuid].path = multerResponse.find(item => item.originalname === file.upload.filename).path;


      file.previewElement.setAttribute("data-media-id", file.upload.uuid);
      this.addSettingsAttributes(file.previewElement.querySelector(".postMediaPreview__item__edit"), fileType === "video" ? "caption" : "crop")
      if(fileType === "image") {
        this.addSettingsAttributes(file.previewElement.querySelector("img"), "crop")
        setTimeout(() => {
          this.emit("thumbnail", file, this.filesUploaded[file.upload.uuid].path);
        }, 10)
      }

      if(fileType === "video") {
         // if file is video, cloudinary provides a thumbnail option
        var {imageURI} = await generateVideoThumbnail(this.filesUploaded[file.upload.uuid].path);
        this.filesUploaded[file.upload.uuid].thumbnail = URL.createObjectURL(imageURI);
        this.setVideoPreview(this.filesUploaded[file.upload.uuid].path, this.filesUploaded[file.upload.uuid].thumbnail, file.previewElement, file);
      }

      
      this.enablePostSubmitButton()
    
    })

    this.on("removedfile", (file) => {
      const fileType = file.type.split("/")[0];
      delete this.filesUploaded[file.upload.uuid]
      // console.log(Object.keys(this.filesUploaded).length, Object.keys(this.filesUploaded) , this.filesUploaded)
      // console.log("encoding: String\n filename: String\n mimetype: String\n originalname: String\n path: String\n size: Number\n thumbnail: {type: Schema.Types.Mixed, default: false}\n mediaType: String")

      if(fileType === "image") {
        this.setGrid()
        if(this.files.length < 4 && this.files.length) {
          this.toggleButton(element, false)
        }
      }

      if(!this.files.length) { 
        this.previewsContainer.classList.remove("active");
        [element, this.gifsButton].forEach(btn => this.toggleButton(btn, false))

        if(!this.postTextarea.value.length) {
          this.submitButton.disabled = true;
        }
      }
    })

    this.on("addedfile", (file) => {
      const firstFileType = this.getFileType(this.files[0])
      const filesAreTheSameType = this.files.slice(1).every(file => this.getFileType(file) === firstFileType);
      // keep in mind that addedFile is a loop, but still works better than other events
      console.log(file.upload)

      
      if(filesAreTheSameType) {
        this.filesUploaded[file.upload.uuid] = file.upload
        console.log("Files are de same type")
        
        if(firstFileType === "image") {
          this.setGrid();
          if(this.files.length === 4) {
            this.toggleButton(element)
          }
        } else {
          if (this.files[1]!=null){
            this.removeFile(this.files[0]);
          }
          
          this.videoLoadingMessage(file.previewElement);
          this.toggleButton(element)
          const classList = ["postMediaPreview__item--video", "loading"]
          file.previewElement.classList.add(...classList)
        }

        this.toggleButton(this.gifsButton)
        this.previewsContainer.classList.add("active");
      } else {
        console.log("Files are NOT de same type")
        this.removeFile(this.files[this.files.length - 1])
        this.createInfoMessage("Choose between 1 video or 4 images.")
        this.previewsContainer.classList.remove("active");
        [element, this.gifsButton].forEach(btn => this.toggleButton(btn, false))
      }
    })

    this.on("uploadprogress", (file, progress) => {
      const fileType = file.type.split("/")[0];
      if(fileType === "video") {
        this.videoUploadIndications(progress);
      } else {
        const progressBar = file.previewElement.querySelector(".dz-progress"); 

        if(progress == 100) {
          setTimeout(() => {
            progressBar && progressBar.remove();
          }, 200)
        }
      }
    })

    this.on("error", (file) => {
      this.removeFile(file);
    })
  }

  enablePostSubmitButton() {
    if(Object.keys(this.filesUploaded).length == this.files.length) {
        this.submitButton.disabled = false;
    }
  }


  videoUploadIndications(progress) {
    this.loadingIndicators.number.textContent = Math.round(progress);

    if(progress >= 50 && progress < 100) {
      this.loadingIndicators.heading.textContent = "Processing";
    } else if(progress == 100) {
      this.loadingIndicators.heading.textContent = "Uploaded";
    } 
  }

  videoLoadingMessage(previewElement) {
    const loadingContainer = document.createElement("div");
    loadingContainer.classList.add("loading-post-message");

    loadingContainer.innerHTML = `<h4><span class="indication--heading">Uploading</span> (<span class="indication--number">0</span>%)</h4>
    <p>It will take a while to upload long videos. Make sure to keep your browser tab open to avoid upload interruptions.</p>`

    previewElement.appendChild(loadingContainer);
    this.loadingIndicators.number = loadingContainer.querySelector(".indication--number");
    this.loadingIndicators.heading = loadingContainer.querySelector(".indication--heading");
  }

  toggleButton(el, disabled = true) {
    el.disabled = disabled;
  }

  addSettingsAttributes(element, targetTab) {
    element.setAttribute("data-target", "mediaSettings")
    element.setAttribute("data-tab", targetTab)
  }


  setVideoPreview(path, thumbnail, previewEl, file) {
    const videoPlayer = document.createElement("video");
    videoPlayer.setAttribute('controls', "controls");
    videoPlayer.setAttribute("preload", "none");
    videoPlayer.setAttribute("poster", thumbnail);
    videoPlayer.muted = true;

    const source = document.createElement("source");
    source.src = path;
    source.type = file.type;

    videoPlayer.appendChild(source)

    previewEl.querySelector(".dz-image").appendChild(videoPlayer);
    previewEl.classList.remove("loading")
    previewEl.classList.add("loaded")
  }

  setGrid() {
    this.previewsContainer.classList = `postMediaPreview postMediaPreview--${this.files.length} active`
  }

  getFileType(file) {
    return file.type.split("/")[0];
  }

  modifyMaxFiles(maxFiles) {
    this.options.maxFiles = maxFiles;
  }

  modifyAcceptedFiles(fileType) {
    console.log(this.options.acceptedFiles);
    this.options.acceptedFiles = `${fileType}/*`
    console.log(this.options.acceptedFiles)
  }

  createInfoMessage(message) {
    clearTimeout(this.hideInfoMessageTimer)

    let infoMessageContainer = document.querySelector(".uploadInfo");
    if(infoMessageContainer) {
      const messageEl = infoMessageContainer.querySelector(".uploadInfo__message p").textContent = message;
    } else {
      infoMessageContainer = document.createElement("div");
      infoMessageContainer.classList.add("uploadInfo")

      infoMessageContainer.innerHTML = `<div class="uploadInfo__message"><p>${message}</p></div>`
      document.body.appendChild(infoMessageContainer);
    }

    this.hideInfoMessageTimer = setTimeout(() => this.removeInfoMessage(), 3000)
  }

  removeInfoMessage() {
    document.querySelector(".uploadInfo").remove();
  }
}

export class UploadFiles extends Dropzone {
  constructor(element, options, formButton) {
    super(element, options)
    // since it extends to dropzone this.files would point to the paramName
    // so it needs to change to an original name, this.filesUploaded will do
    this.filesUploaded = [];
    this.formButton = formButton;
    this.officeRegex = new RegExp('(pdf|docx?|xlsx?|pptx?)');
    this.errorTimeout = null;

    this.on("success", async function(file, multerResponse) {
      const targetResponse = multerResponse.find(item => item.originalname === file.upload.filename);
      const targetFileIndex = this.filesUploaded.findIndex(item => item.filename === targetResponse.originalname);
      const ext = this.getFileExtension(targetResponse.path);

      const {thumbnail, mediaType, duration} = await this.#createHTMLBasedOnFileExtension(file, targetResponse.path, ext);
      let currentFileProps = { ...targetResponse, thumbnail, mediaType, mimetype: file.type }
      if(duration) {
        currentFileProps.duration = duration
      }
      this.filesUploaded[targetFileIndex] = {...this.filesUploaded[targetFileIndex], ...currentFileProps}
    })

    this.on("addedfile", (file) => {
      this.filesUploaded.push(file.upload);
      this.#preventDuplicates(file);
      this.#togglePreviewActiveClass(this.files.length > 0)
    })

    this.on("queuecomplete", files => {
      this.#formButtonDisabled(false);
      console.log("uploading completed")
    })

    this.on("uploadprogress", (file, progress) => {
      const progressBar = file.previewElement.querySelector(".dz-progress"); 
      // if(file.size < 10000000) {
      //   progressBar && progressBar.remove();
      //   return;
      // }

      if(progress == 100) {
        setTimeout(() => {
          progressBar && progressBar.remove();
        }, 200)
      }
    })

    this.on("error", (file, message) => {
      clearTimeout(this.errorTimeout)
      this.removeFile(file);

      this.errorTimeout = setTimeout(() => {
        this.#createErrorModal(message);
      }, 1)
    })

    this.on("removedfile", (file) => {
      this.#removeFile(file);

      if(!this.files.length) {
        this.#togglePreviewActiveClass(this.files.length)
      }
    })
  }

  reset() {
    this.filesUploaded = [];
    this.removeAllFiles(true);
  }

  #formButtonDisabled(bool) {
    this.formButton.disabled = bool;
  }

  #createErrorModal(message) {
    let modal = document.getElementById("uploadErrorModal");
    let messageTextContent = message;

    if(!modal) {
      modal = document.createElement("div");
      modal.classList.add("modal");
      modal.setAttribute("id", "uploadErrorModal");
      document.body.appendChild(modal);

      let prompt = document.createElement("div");
      prompt.classList.add("modal-container");
      prompt.classList.add("center");

      const header = document.createElement("h2");
      header.textContent = "Files did not upload.";

      const subHeading = document.createElement("p")
      subHeading.classList.add("upload-error-message");

      const closeModalButton = document.createElement("button");
      ['modal-close', 'round', 'btn-icon'].forEach(className => {
        closeModalButton.classList.add(className);
      })

      const acceptAndCloseButton = document.createElement("button");
      acceptAndCloseButton.classList.add("close-prompt");
      acceptAndCloseButton.textContent = "Close"

      Array.from([closeModalButton, acceptAndCloseButton]).forEach(el => {
        el.addEventListener("mousedown", setInitialModalTarget)
        el.addEventListener("mouseup", e => closeModal(e, modal))
      })
      
      prompt.append(closeModalButton, header, subHeading, acceptAndCloseButton)
      modal.appendChild(prompt);
    }

    if(message === "You can not upload any more files.") {
      messageTextContent = `${message} Upload limit is ${this.options.maxFiles}.`
    }

    modal.querySelector(".upload-error-message").textContent = messageTextContent;
    openModal(modal);
  }

  #preventDuplicates(file) {
    if(this.files.length) {
      for(let i = 0; i < this.files.length -1; i++) {
        if(this.files[i].name === file.name && this.files[i].size === file.size) {
          this.removeFile(file);
          break;
        }
      }
    }
  }

  #removeFile(file) {
    const xhrResponseFromFile = file?.xhr?.response && JSON.parse(file.xhr?.response);

    if(xhrResponseFromFile) {
      const {filename: fn, originalname: on, path: p, size: sz} = xhrResponseFromFile;
      const index = this.filesUploaded.
      findIndex(({filename, originalname, path, size}) => {
        return filename === fn
        && originalname === on
        && path === p
        && size === sz
      })

      this.filesUploaded.splice(index, 1);
      if(!this.filesUploaded.length) this.#formButtonDisabled(true);
    }

      
  }

  #togglePreviewActiveClass(toggle) {
    toggle ? this.previewsContainer.classList.add("active") : this.previewsContainer.classList.remove("active")
    const blend = this.previewsContainer.nextElementSibling;
    if(blend) {
      toggle ? blend.classList.add("active") : blend.classList.remove("active")
    }
  }

  async #createHTMLBasedOnFileExtension(file, filePath, ext) {
    // returns a thumbnail if needed
    const previewElement = file.previewElement;

    switch(ext.toLowerCase()) {
      case "mp4":
      case "mkv":
      case "avi":
        var {imageURI, duration} = await this.#generateVideoThumbnail(filePath);
        this.emit("thumbnail", file, URL.createObjectURL(imageURI));
        this.#addVideoIcon(file);
        console.log("DURATION ", duration)
        return {thumbnail: URL.createObjectURL(imageURI), mediaType: "video", duration: duration}
      case "pdf":
      case "doc": 
      case "docx": 
      case "xls": 
      case "xlsx": 
      case "ppt":
      case "pptx":
        this.#createOfficeLayout(file, ext)
        return {thumbnail: `/icons/officeIcons/${ext.length > 3 ? ext.substring(0, 3) : ext}.png`, mediaType: "file"}
      case "txt":
      case "src":
        this.#createGeneralFileLayout(previewElement)
        return {thumbnail: `<div class="icon"><i class="fa-solid fa-file-lines"></i></div>`, mediaType: "file"};
      default: 
        return {thumbnail: false, mediaType: "image"};;
    }
  }

  #createGeneralFileLayout(container) {
    container.classList.add("generalFileLayout");
    const dzImage = container.querySelector(".dz-image")
    const imageElement = dzImage.querySelector("img");
    imageElement.remove();
    const iconContainer = document.createElement("div");
    iconContainer.classList.add("icon");
    const icon = document.createElement("i");
    icon.classList.add("fa-solid");
    icon.classList.add("fa-file-lines");
    iconContainer.appendChild(icon);
    dzImage.appendChild(iconContainer);
  }

  #createOfficeLayout(file, ext) {
    file.previewElement.classList.add("officeLayout");

    this.emit("thumbnail", file, `/icons/officeIcons/${ext.length > 3 ? ext.substring(0, ext.length - 1) : ext}.png`);
  }

  getFileExtension(filePath) {
    const extension = filePath.split(".").pop();
    return extension;
  }

  #createPlayIcon(imageContainer) {
    const icon = document.createElement("div");
    icon.classList.add("playIcon");

    icon.insertAdjacentHTML("afterbegin", `<i class="fa-solid fa-play"></i>`);
    imageContainer.appendChild(icon);
  }

  #addVideoIcon(file) {
    const dzImageContainer = file.previewElement.querySelector(".dz-image");
    this.#createPlayIcon(dzImageContainer);
  }

  async #generateVideoThumbnail(filePath) {
    return generateVideoThumbnail(filePath)
  }

}

function generateVideoThumbnail(filePath) {
  return new Promise((resolve, reject) => {
    // load the file to a video player
    const videoPlayer = document.createElement('video');
    videoPlayer.setAttribute('src', window.location.origin + filePath);
    videoPlayer.load();
    videoPlayer.addEventListener('error', (ex) => {
        reject("error when loading video file", ex);
    });
    // load metadata of the video to get video duration and dimensions
    videoPlayer.addEventListener('loadedmetadata', () => {
        // seek to user defined timestamp (in seconds) if possible
        let seekTo = videoPlayer.duration / 10;
        if (videoPlayer.duration < seekTo) {
            reject("video is too short.");
            return;
        }
        // delay seeking or else 'seeked' event won't fire on Safari
        setTimeout(() => {
          videoPlayer.currentTime = seekTo;
        }, 200);
        // extract video thumbnail once seeking is complete
        videoPlayer.addEventListener('seeked', (e) => {
            // define a canvas to have the same dimension as the video
            const duration = e.target.duration;
            const canvas = document.createElement("canvas");
            canvas.width = videoPlayer.videoWidth;
            canvas.height = videoPlayer.videoHeight;
            // draw the video frame to canvas
            const ctx = canvas.getContext("2d");
            ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
            // return the canvas image as a blob
            ctx.canvas.toBlob(
                blob => {
                    return resolve({imageURI: blob, duration}); 
                },
                "image/jpeg",
                0.75 /* quality */
            );
          });
      });
  });
}


export const uploadMultipleTemplate = `<div class="dz-preview dz-processing dz-success dz-complete dz-image-preview">
                            <div class="dz-remove icon" data-dz-remove>
                              <i class="fa-regular fa-xmark"></i>
                            </div>
                            <div class="dz-image">
                              <img data-dz-thumbnail />
                            </div>
                            <div class="dz-details">
                              <div class="dz-filename">
                                <span data-dz-name></span>
                              </div>
                            </div>
                            <div class="dz-progress">
                              <span class="dz-upload" data-dz-uploadprogress></span>
                            </div>
                          </div>`


export const uploadPostMediaTemplate = `<div class="postMediaPreview__item dz-preview dz-processing dz-success dz-complete dz-image-preview">
                                              <button class="postMediaPreview__item__close-icon dz-remove" data-dz-remove type="button">&#10005;</button>
                                              <div class="postMediaPreview__item__actions">
                                                <button class="postMediaPreview__item__edit" type="button"><i class="fa-solid fa-paintbrush"></i></button>
                                              </div>
                                              <div class="dz-image">
                                                <img data-dz-thumbnail />
                                              </div>
                                              <div class="dz-progress">
                                                <span class="dz-upload" data-dz-uploadprogress></span>
                                              </div>
                                            </div>`





