import { openModal, closingModalInitialState } from "./modal.js";

export function createImageGallery(e, posts) {
  if(e.target.tagName.toLowerCase() === "img" && e.target.dataset.toggle == "modal") {
    const post = posts[e.target.closest(".postContainer").dataset.postId];
    new PostImageGallery(post, e.target.src)
  }
}

class PostImageGallery {

  constructor(post, selectedImageSource) {
    this.modal = document.getElementById("imageGalleryModal")
    this.post = post;
    this.images = this.post.media;
    this.selectedImage = this.images.find(img => img.path == selectedImageSource);
    this.imagesContainer = this.modal.querySelector(".galleryContent");
    this.scroller = null;
    this.initialModalTarget = null;

    openModal(this.modal)
    this.createGallery();

    this.imagesContainer.addEventListener("mousedown", (e) => {
      console.log(!e.target.classList.contains("galleryContent__arrow"))
      if(!e.target.classList.contains("galleryContent__arrow")) {
        this.initialModalTarget = this.scroller;
      } else {
        this.initialModalTarget = null;
      }
    })
    this.imagesContainer.addEventListener("mouseup", e => {

      if(e.target == this.initialModalTarget || e.target === e.currentTarget || e.target.classList.contains("galleryContent__scroller__item") && this.initialModalTarget) {
        closingModalInitialState(this.modal)
        this.imagesContainer.innerHTML = "";
        const clone = this.imagesContainer.cloneNode(true);
        this.imagesContainer.remove();
        this.modal.querySelector(".gallery").appendChild(clone)
      }
      
    })

    this.imagesContainer.addEventListener("click", (e) => this.switchImages(e))
  }

  switchImages(e) {
    const directions = ["left", "right"];

    if(e.target.tagName.toLowerCase() == "button" && e.target.dataset.direction) {
      const direction = e.target.dataset.direction;
      const oppositeDirection = directions.find(d => d !== direction);
      const targetIndex = direction == "left" ? this.selectedImageIndex() - 1 : this.selectedImageIndex() + 1
      this.selectedImage = this.images[targetIndex];
      this.scroller.style.transform = `translateX(-${window.innerWidth * this.selectedImageIndex()}px)`

      this.imagesContainer.querySelector(`button[data-direction="${oppositeDirection}"]`).classList.remove("d-none")

      if(this.images[targetIndex + 1]) {
        console.log("if")
        this.imagesContainer.querySelector(`button[data-direction="right"]`).querySelector("img").src = this.images[targetIndex + 1].path;
      } else {
        this.imagesContainer.querySelector(`button[data-direction="right"]`).classList.add("d-none");
      }

      if(this.images[targetIndex - 1]) {
        console.log("else")
        this.imagesContainer.querySelector(`button[data-direction="left"]`).querySelector("img").src = this.images[targetIndex - 1].path;
      } else {
        this.imagesContainer.querySelector(`button[data-direction="left"]`).classList.add("d-none");
      }
    }
  }

  createGallery() {
    const scroller = document.createElement("div");
    scroller.classList.add("galleryContent__scroller");
    this.scroller = scroller;

    this.images.forEach(img => {
      const container = document.createElement("div");
      container.classList.add("galleryContent__scroller__item");
      const image = document.createElement("img");
      image.src = img.path;
      image.alt = img.originalname;
      container.appendChild(image);
      scroller.appendChild(container);
    })


    this.imagesContainer.appendChild(scroller, window.innerWidth * this.images.indexOf(this.selectedImage))
    this.scroller.style.transform = `translateX(-${window.innerWidth * this.selectedImageIndex()}px)`

    this.controls();
  }

  selectedImageIndex() {
    return this.images.indexOf(this.selectedImage)
  }

  controls() {
    ["left", "right"].forEach(direction => {
      const targetIndex = direction == "left" ? this.selectedImageIndex() - 1 : this.selectedImageIndex() + 1
      const arrow = document.createElement("button")
      arrow.type = "button"
      arrow.classList.add("galleryContent__arrow")
      arrow.classList.add(`galleryContent__arrow--${direction}`)
      arrow.setAttribute("data-direction", direction)
      

      const icon = document.createElement("i")
      icon.classList.add("fa-solid")
      icon.classList.add(`fa-chevron-${direction}`)
      arrow.appendChild(icon)


      const imageEl = document.createElement("img");
      arrow.appendChild(imageEl)
      if(this.images[targetIndex]) {
        imageEl.src = this.images[targetIndex].path
      } else {
        arrow.classList.add("d-none")
      }


      this.modal.querySelector(".galleryContent").appendChild(arrow);
    })
  }
}

