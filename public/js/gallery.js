export class Gallery {
  constructor(container, items, activeIndex) {
    this.container = container;
    this.galleryItemsContainer = null;
    this.scroller = null; 
    this.galleryContentContainer = container.querySelector(".galleryContent");
    this.items = items;
    this.activeIndex = activeIndex;
    this.hideControlsTimer = null;

    this.#resetGallery()
    this.#createGalleryItemsContainer()
  }

  #controlEl(side) {
    const control = document.createElement("button");
    control.setAttribute("data-side", side);
    control.classList.add("controls");
    control.classList.add(side);

    const iconContainer = document.createElement("div");
    iconContainer.classList.add("controls__icon");
    

    const icon = side === "right" ? `<i class="fa-solid fa-chevron-right"></i>` : `<i class="fa-solid fa-chevron-left"></i>`;

    iconContainer.innerHTML = icon;
    control.appendChild(iconContainer);

    
    this.galleryContentContainer.appendChild(control);
  }

  #createControls() {
    ["left", "right"].forEach(side => this.#controlEl(side))
  }

  #scrollPosition() {
    if(this.scroller.scrollWidth > window.innerWidth) {
      let activeIndex = parseInt(this.activeIndex) + 1;
      // get how many items window.innerWidth can hold
      const itemWidth = this.scroller.querySelector(".galleryItems__item").offsetWidth;
      const visibleItems = Math.round(window.innerWidth / (itemWidth + 8))

      // always keep activeIndex in the middle;
      let offset;
      if(activeIndex + visibleItems || (activeIndex + visibleItems) > this.items.length || (activeIndex >= (visibleItems / 2) && activeIndex <= visibleItems)) {
        offset = activeIndex - (visibleItems / 2);
      } else {
        offset = (activeIndex + 1) + (visibleItems / 2);
      }
      this.scroller.scrollTo(offset * (itemWidth + 8), 0)
  
    }
  }


  #createGalleryItemsContainer() {
    this.container.style.flexDirection = "column";
    this.container.tabIndex = 0;
    this.container.focus();

    const galleryItemsContainer = document.createElement("div");
    galleryItemsContainer.classList.add("galleryItems");
    this.galleryItemsContainer = galleryItemsContainer;

    const galleryItemsScroller = document.createElement("div");
    galleryItemsScroller.classList.add("galleryItems__scroller");
    galleryItemsContainer.appendChild(galleryItemsScroller)
    this.scroller = galleryItemsScroller;

    let itemsLen = this.items.length;
    if(itemsLen * 56 < window.innerWidth) {
      this.scroller.style.justifyContent = "center"
    }
    
    this.container.appendChild(galleryItemsContainer);
    
    for(let i = 0; i < itemsLen; i++) {
      const item = this.items[i];
      this.#createGalleryItem(item, i)
      
      if(i === this.activeIndex) {
        this.#displayItem(i);
      }
    }


    this.#createControls();
    this.#hideControls();
    this.#scrollPosition();
    this.scroller.style.scrollBehavior = "smooth";
    
    this.galleryContentContainer.addEventListener("click", e => this.#controlsListener(e))
    this.galleryItemsContainer.addEventListener("click", e => this.#selectItem(e))
    this.container.addEventListener("mousemove", _.throttle(e => this.#showControls(e), 200))
    this.container.addEventListener("keydown", this.#keydownController.bind(this))
  }

  #setActiveItem(goToIndex) {
    this.galleryItemsContainer.querySelector(`[data-index="${this.activeIndex}"]`).classList.remove("active");
    this.galleryItemsContainer.querySelector(`[data-index="${goToIndex}"]`).classList.add("active");

    this.activeIndex = goToIndex;
    this.#displayItem(this.activeIndex);
    this.#scrollPosition();
    this.#hideControls();
  }

  #keydownController(e) {
    let goToIndex = null;

    // if(parseInt(this.activeIndex) - 1 < 0 || ) return;

    if(e.which === 39 || e.keyCode === 39 || e.key === "ArrowRight" || e.code === "ArrowRight") {
      goToIndex = parseInt(this.activeIndex) + 1 > this.items.length - 1 ? this.activeIndex : +this.activeIndex + 1;
    } else if(e.which === 37 || e.keyCode === 37 || e.key === "ArrowLeft" || e.code === "ArrowLeft") {
      goToIndex = parseInt(this.activeIndex) - 1 < 0 ? this.activeIndex : +this.activeIndex - 1;
    }

    if(goToIndex !== null) {
      this.#setActiveItem(goToIndex);
    }
  }

  #showControls() {
    clearTimeout(this.hideControlsTimer)
    const controls = this.container.querySelectorAll(".controls");
    controls.forEach(ctrl => ctrl.classList.remove("hide"))
    this.hideControlsTimer = setTimeout(() => {
      controls.forEach(ctrl => ctrl.classList.add("hide"))
    }, 2000)
  }

  #controlsListener(e) {
    if(e.target.tagName === "BUTTON") {
      const side = e.target.dataset.side;

      let goToIndex = side === "right" ? +this.activeIndex + 1 : +this.activeIndex - 1;

      this.#setActiveItem(goToIndex);
    }
  }

  #displayItem(index) {
    this.galleryContentContainer.querySelector(".galleryContent__item")?.remove();

    const item = this.items[index];

    const elementName = item.mediaType === "image" ? "img" : "video";

    const el = document.createElement(elementName);
    el.classList.add("galleryContent__item");
    el.src = item.path;
    if(item.mediaType === "video") {
      el.setAttribute("controls", true)
      el.setAttribute("autoplay", true)
      el.muted = true;
    }

    this.galleryContentContainer.appendChild(el);
  }

  #resetGallery() {
    this.container.querySelector(".galleryItems")?.remove();
    this.container.querySelector(".galleryContent").innerHTML = "";
  }

  #hideControls() {
    const activeIndex = parseInt(this.activeIndex)
    
    if(activeIndex + 1 === this.items.length) {
      this.galleryContentContainer.querySelector(`.controls[data-side="right"]`).classList.add("d-none");
      this.galleryContentContainer.querySelector(`.controls[data-side="left"]`).classList.remove("d-none");
    } else if(activeIndex - 1 < 0) {
      this.galleryContentContainer.querySelector(`.controls[data-side="left"]`).classList.add("d-none");
      this.galleryContentContainer.querySelector(`.controls[data-side="right"]`).classList.remove("d-none");
    } else {
      this.galleryContentContainer.querySelector(`.controls.d-none`)?.classList.remove("d-none");
    }
    
  }


  #selectItem(e) {
    if(e.target.tagName === "IMG") {
      const clickedIndex = e.target.dataset.index;
      this.galleryItemsContainer.querySelector(`[data-index="${this.activeIndex}"]`).classList.remove("active");
      this.galleryItemsContainer.querySelector(`[data-index="${clickedIndex}"]`).classList.add("active");
      this.activeIndex = clickedIndex;

      this.#hideControls();
      this.#displayItem(this.activeIndex);
      this.#scrollPosition();
    }
  }

  #createGalleryItem(item, i) {
    let imageSRC = item.mediaType === "image" ? item.path : item.thumbnail;

    
    const imgEl = document.createElement("img");
    imgEl.classList.add("galleryItems__item");
    imgEl.setAttribute("data-index", i);
    imgEl.src = imageSRC;
    imgEl.setAttribute("data-id", item.id);

    if(i === this.activeIndex) {
      imgEl.classList.add("active");
    }

    this.scroller.appendChild(imgEl)
  }
}