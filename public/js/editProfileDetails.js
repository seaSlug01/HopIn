import { elements, isSelectorSupported, createSpinnerV2 } from "./common.js";
import {openModal, closeModal, setInitialModalTarget} from "./modal.js";
import { Range } from "./customRangeInput.js";

var cropper;
let range;
// define more elements that you'll need, an action that wouldn't be required if there was no edit button
const form = document.getElementById('editProfileDetailsForm');
const saveBtn = document.getElementById("save");
const previewImageCropContainer = form.previousElementSibling;
const formElements = Array.from(form.elements);
const birthDateContainer = document.querySelector(".birthDateContainer"); 
const birthDatePreview = document.querySelector(".birthDatePreview"); 
const birthDateTabContainer = document.querySelector(".birthDateTabContainer");
const birthDateTabContainerSelectionInputs = birthDateTabContainer.querySelectorAll("select");
const saveButton = document.getElementById("save");
const editProfileImageContainer = document.getElementById("editProfileImage");
const editCoverImageContainer = document.getElementById("editCoverImage");
const applyCropBtn = document.querySelector(".applyCrop");
const removeCoverBtn = document.querySelector(".removeCover");

let userHasCover = document.querySelector(".editCoverImage__temp")?.src || null;

// DROPZONE HERE
function dropzoneBorder(el, bool) {
  bool ? el.classList.add("dashed") : el.classList.remove("dashed")
}

Dropzone.autoDiscover = false;
class UploadImage extends Dropzone {
  constructor(element, container, options) {
    super(element, options)
    this.container = container; 
    this.fileUploaded = {};
  }

  async showCropper() {
    elements.editProfileDetailsModal.setAttribute("data-lock", "");
    const previewImageCropContainer = form.previousElementSibling;
    previewImageCropContainer.classList.remove("d-none");
    const previewImageCrop = previewImageCropContainer.querySelector(".previewImageCrop");
    previewImageCrop.setAttribute("src", this.fileUploaded.path)
    previewImageCropContainer.setAttribute("data-target", this.fileUploaded.target)

  
    if(cropper !== undefined) {
      cropper.destroy();
    } 

    
    let aspectRatio = this.fileUploaded.target === "profilePic" ? 1/1 : 26/9;
    
    cropper = await new Cropper(previewImageCrop, {
      ready: () => {
        this.fileUploaded.target === "coverPic" && cropper.setCropBoxData({
          width: elements.editProfileDetailsModal.querySelector(".modal-container").offsetWidth,
        });
        range = new Range("range", cropper);
      },
      aspectRatio,
      background: false,
      viewMode: 3,
      zoom: function(e) {
        if (e.detail.ratio > 2) {
            e.preventDefault();
            return;
        }
        
        range.setRangeCropperZoom(e.detail.ratio);
      
      }
    });
    
  }
}


function dropzoneOptions(previewsContainer, target) {
  return { 
    url: "/uploads/dropzone/single/",
    acceptedFiles: "image/*",
    previewsContainer,
    maxFiles: 1,
    paramName: "file",
    resizeQuality: 0.7,
    // createImageThumbnails: false,
    init: function() {
      this.on("maxfilesexceeded", function(file) {
        this.removeAllFiles();
        this.addFile(file);
      })

      this.on("success", async function(file, resp) {
        dropzoneBorder(this.container)
        form.classList.add("d-none");
        
        const image = this.container.querySelector(`.${this.container.id}__temp`);
        if(image) {
          image.remove();
        }
        
        
        this.fileUploaded = {...resp.data, target};
        await this.showCropper();     
      })
    }
  }
}



// dropzone profile pic
const dropzoneProfilePic = new UploadImage("#profileImageDz", editProfileImageContainer, dropzoneOptions("#previewProfileImage", "profilePic"));
// dropzone cover pic
const dropzoneCoverPic = new UploadImage("#coverImageDz", editCoverImageContainer, dropzoneOptions("#previewCoverImage", "coverPic"));

[{dz: dropzoneProfilePic, container: editProfileImageContainer}, {dz: dropzoneCoverPic, container: editCoverImageContainer}].forEach(({dz, container}) => {
  dz.on("dragenter", () => {
    dropzoneBorder(container, true)
  })
  dz.on("dragleave", () => {
    dropzoneBorder(container)
  })
})


function loadingIndication() {
  const spinner = createSpinnerV2();
  const modalHeader = elements.editProfileDetailsModal.querySelector(".modal-header")  
  modalHeader.insertBefore(spinner, modalHeader.querySelector(".btn-black"));
}

function applyCrop() {
  const canvas = cropper.getCroppedCanvas();

  if(canvas == null) {
    alert("Could not get image, make sure its an image file.");
    return;
  }

  loadingIndication();
  applyCropBtn.textContent = "Applying";
  applyCropBtn.disabled = true;
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("file", blob);

    const response = await axios.post("/uploads/cropper", formData);
    
    console.log(response)
    let dropzoneObject;
    if(previewImageCropContainer.dataset.target === "profilePic") {
      dropzoneObject = dropzoneProfilePic;
    } else if(previewImageCropContainer.dataset.target === "coverPic") {
      dropzoneObject = dropzoneCoverPic; 
      removeCoverBtn.classList.remove("d-none");
    }

    cropperComplete(dropzoneObject, response.data);
  }, "image/jpeg")
}
// CROPPER SUBMIT
applyCropBtn.addEventListener("click", applyCrop)

function cropperComplete(dropzoneObj, newFile) {
  cropper.destroy();
  cropperResetDOM();
  dropzoneObj.fileUploaded = newFile;
  dropzoneObj.container.querySelector(".dz-image img").setAttribute("src", dropzoneObj.fileUploaded.path)
}

// Cropper cancel
const cropperCancelButton = document.querySelector(".cancelCrop");

function cropperResetDOM() {
  delete window.range;
  elements.editProfileDetailsModal.removeAttribute("data-lock");
  previewImageCropContainer.removeAttribute("data-target");
  previewImageCropContainer.classList.add("d-none");
  form.classList.remove("d-none");
  elements.editProfileDetailsModal.querySelector(".messages-loading-spinner").remove();
  applyCropBtn.textContent = "Apply";
  applyCropBtn.disabled = false;
}

function cancelCropper(e) {
  if(e.target.parentNode.parentNode.getAttribute("data-target") === "coverPic") {
    applyCrop();
  } else {
    cropper.destroy();
    cropperResetDOM();
  }
  
}


cropperCancelButton.addEventListener("click", cancelCropper)




formElements.filter(el => el.type !== "textarea").forEach(el => {
  el.addEventListener("keydown", e => {
    if(e.key === "Enter" || e.keyCode === 13 || e.which === 13) e.preventDefault()
  })
})

birthDateContainer.addEventListener("click", e => {

  if(e.target.classList.contains("toggleBirthDateTab")) {
    if(!birthDatePreview.classList.contains("d-none")) {
      birthDatePreview.classList.add("d-none");
      birthDateTabContainer.classList.remove("d-none")
      birthDateTabContainerSelectionInputs.forEach(selectBox => selectBox.disabled = false)
      form.scrollTo(0, form.offsetHeight - 150)
    } else {
      birthDatePreview.classList.remove("d-none");
      birthDateTabContainer.classList.add("d-none")
      birthDateTabContainerSelectionInputs.forEach(selectBox => selectBox.disabled = true)
    }
  }
})

console.log("This page is loaded")
// open and close handlers
document.querySelector(".edit-profile").addEventListener("click", (e) => {
  openModal(document.getElementById(e.target.dataset.target))
})

elements.editProfileDetailsModal.addEventListener("mousedown", setInitialModalTarget)
elements.editProfileDetailsModal.addEventListener("mouseup", (e) => {
  if(e.target.dataset.lock !== undefined) return;
  closeModal(e)
})

const delegateIf = (target, tags) => {
  let tagList = !Array.isArray(tags) ? Array.from(tags) : tags;
  let bool = false;

  tagList.forEach(tag => {
    if(target.type === tag) {
      bool = true;
      return;
    }
  })
  return bool;
}

class InvalidInput {

  constructor(targetInput, isInvalid) {
    this.invalid = isInvalid;
    this.targetInput = targetInput;
    this.container = this.targetInput.parentElement.parentElement;
    this.label = this.container.querySelector("label");
    this.placeholder = this.label.querySelector(".placeholder");
  }

  decideIfValid() {
    if(this.targetInput.value === "") {
      this.#invalidate();
    } else {
      this.#validate();
    }
  }

  addInvalidFocusStyles(op) {
    if(this.isInvalid) {
      if(op == "focus") {
        this.placeholder.setAttribute("data-color", "red")
        this.label.setAttribute("data-color", "transparent")
      } else if(op == "blur") {
        this.placeholder.removeAttribute("data-color", "red")
        this.label.dataset.color = "red"
      }
    }
  }

  #createWarningMessage() {
    let warningMessage = document.createElement("p");
    warningMessage.classList.add("warning");
    warningMessage.textContent = `${this.placeholder.textContent} can't be empty, stupid`
    this.container.append(warningMessage);
  }

  #invalidate() {
    this.isInvalid = true;
    this.targetInput.setCustomValidity("Name can't be be empty, stupid");
    this.container.classList.add("invalid");
    this.placeholder.setAttribute("data-color", "red")
    this.label.setAttribute("data-color", "transparent");
    this.#createWarningMessage()
    saveButton.disabled = true;
  }

  #validate() {
    if(this.isInvalid) {
      this.isInvalid = false;
      this.targetInput.setCustomValidity("")
      this.placeholder.removeAttribute("data-color")
      this.container.classList.remove("invalid");
      this.label.removeAttribute("data-color");
      this.container.querySelector(".warning").remove();
      saveButton.disabled = false;
    }
  }
}

const nameInputValidation = new InvalidInput(document.querySelector(".edit-input-group input"), false);

// no need to have an onload for adding the shrink class cuz that will depend from the backend
const focusInput = (evt, operation) => {
  const formEl = evt.target;
  const hasSelectorSupported = isSelectorSupported("body:has(input)");
  const label = formEl.parentElement;
  const placeholder = label.querySelector(".placeholder");

  // add or remove shrink class
  // based on if element value exists OR element is focused
  formEl.value !== "" || operation == "focus" ?
      placeholder.classList.add("shrink") :
      placeholder.classList.contains("shrink") && placeholder.classList.remove("shrink");


  if(!hasSelectorSupported) {
    const container = label.parentElement;
    operation === "focus" ? container.classList.add("focused") : container.classList.remove("focused");
    nameInputValidation.addInvalidFocusStyles(operation);
  }
}

form.addEventListener("input", e => {
const conditionFulfilled = delegateIf(e.target, ["text", "textarea"]);

if(conditionFulfilled) {
    const charsWritten = e.target.value.length;
    const counter = e.target.parentElement.querySelector(".counter");
    const countNumberLimit = counter.textContent.split("/")[1].trim();

    if(e.target.name === "name") {
      nameInputValidation.decideIfValid();
    }

    if(charsWritten > countNumberLimit) {
      e.target.value = e.target.value.slice(0, countNumberLimit)
    } else {
      counter.textContent = `${charsWritten} / ${countNumberLimit}`;
    }
  }
})

form.addEventListener("paste", e => {
  const conditionFulfilled = delegateIf(e.target, ["text", "textarea"]);
  if(conditionFulfilled) {
    const inputValue = e.target.value;
    const counter = e.target.parentElement.querySelector(".counter");
    const countNumberLimit = counter.textContent.split("/")[1].trim();
    let paste = e.clipboardData.getData("text");
    
    const withPastedInput = Number(countNumberLimit) - (Number(inputValue.length) + Number(paste.length));
    
    if(withPastedInput < 0) {
      e.target.value = `${inputValue}${paste.slice(0, paste.length - withPastedInput)}`
    }

    counter.textContent = `${e.target.value.length + withPastedInput} / ${countNumberLimit}`
  }
})



form.addEventListener("focusin", e => {
  const conditionFulfilled = delegateIf(e.target, ["text", "textarea", "select-one"]);
  if(conditionFulfilled) {
    focusInput(e, "focus")
  }
})

form.addEventListener("focusout", e => {
  const conditionFulfilled = delegateIf(e.target, ["text", "textarea", "select-one"]);
  if(conditionFulfilled) {
    focusInput(e, "blur")
  }
})


// Cover pic
let saveCover = userHasCover;
function hideCoverButton(dropzoneObj) {
  const imageToRemove = dropzoneObj.container.querySelector("img");
  imageToRemove.remove();
  if(dropzoneObj.fileUploaded.path !== undefined && userHasCover) {
    console.log("if")
    const resetImage = document.createElement("img");
    resetImage.classList.add("editCoverImage__temp");
    resetImage.src = userHasCover;
    dropzoneObj.container.append(resetImage);
    dropzoneObj.fileUploaded.path = null;
  } else if(dropzoneObj.fileUploaded.path !== undefined && !userHasCover) {
    console.log("else if")
    dropzoneObj.fileUploaded.path = null;
    removeCoverBtn.classList.add("d-none");
  } else if(userHasCover) {
    console.log("2nd else if")
    userHasCover = null;
    removeCoverBtn.classList.add("d-none");
  }
  
}

removeCoverBtn.addEventListener("click", e => {
    hideCoverButton(dropzoneCoverPic);
})


const submitForm = async e => {
  e.preventDefault();
  elements.editProfileDetailsModal.setAttribute("data-lock", "");
  const formData = new FormData(form);

  if(dropzoneProfilePic.fileUploaded.path !== undefined) {
    formData.append("profilePic", dropzoneProfilePic.fileUploaded.path)  
  }

  formData.append("originalCover", userHasCover ? saveCover : "")
  if(dropzoneCoverPic.fileUploaded && dropzoneCoverPic.fileUploaded.path) {
    formData.append("coverPic", dropzoneCoverPic.fileUploaded.path) 
  }

  if(dropzoneProfilePic.fileUploaded.path || dropzoneCoverPic.fileUploaded.path) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving"
    setTimeout(() => {
      document.querySelector(".loadingMessage").classList.add("show");
    }, 3000)
  }

  

  const formProps = Object.fromEntries(formData);
  try {
    console.log("awaiting");
    await axios.put(`/api/users/${form.getAttribute("data-id")}/edit`, formProps);
    console.log("done")
    window.location.reload();
  } catch(error) {
    console.log(error);
    elements.editProfileDetailsModal.removeAttribute("data-lock");
    if(error && error?.response?.status === 400) {
      let errors = error.response.data.error;
      console.log(errors);
    }
  }

}

form.addEventListener("submit", submitForm);
navigator.userAgent.indexOf("Firefox") != -1 && saveBtn.addEventListener("click", submitForm);

window.addEventListener("beforeunload", async () => {
  await axios.delete(`/uploads/deleteTempUserFiles/${form.getAttribute("data-id")}`);
})


