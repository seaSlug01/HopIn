export class Range {
   constructor(elementId, cropper = false) {
    this.container = document.getElementById(elementId);
    this.cropper = false || cropper;
    this.cropperZoomLimit = 2.00;
    this.zoomStartsFrom = null; // Because initialZoom is inconsistent and probably based on image quality
  

    this.#createInnerHTML();
    this.ball = this.container.querySelector(".ball");
    this.progress = this.container.querySelector(".progress");
    this.range = this.container.querySelector(".range");

    this.xPosition = null;
    this.lastElementBeforeExitingContainer = null;
    this.startingPosition = null;
    this.xPositionBeforeItLeft = null;
    this.distanceTraveled = 0;
    this.isCursorActive = false;

    window.addEventListener("mousemove", (e) => {
      if(!this.isCursorActive) this.ball.classList.contains("scaleUp") && this.ball.classList.remove("scaleUp")
        this.#hoverMyBall(e)
        this.setBall(e);
    })

    this.container.addEventListener("mousedown", e => {
      this.isCursorActive = true;
      this.ball.classList.add("scaleUp", "hover")
      this.setBall(e)
    })

    window.addEventListener("mouseup", (e) => {
      this.isCursorActive = false
    });

    this.container.addEventListener("mouseleave", e => {
      this.ball.classList.remove("hover");
      if(!this.isCursorActive) this.ball.classList.remove("scaleUp")
    })
  }

  #createInnerHTML() {
    this.container.classList.add("rangeContainer");

    this.container.innerHTML = `<div class="range">
                                  <div class="progress"></div>
                                  <div class="ball"></div>
                                </div>`
  }

  setDirection() {
    return this.distanceTraveled > 0 ? "right" : "left";
  }

  #getXPosition(e, element) {
    let rect = element.getBoundingClientRect();
    return e.clientX - rect.left;
  }

  setBall(e = this.container) {
    if(this.isCursorActive) {
      let { max } = this.#getMaxRange();
      let x;
  
     
      if(e.target !== this.container) {
          
          if(!this.startingPosition) {
            this.lastElementBeforeExitingContainer = e.target;
            x = this.#getXPosition(e, this.lastElementBeforeExitingContainer)
            this.startingPosition = x;
            this.xPositionBeforeItLeft = this.xPosition;
            return;
          }
          x = this.#getXPosition(e, this.lastElementBeforeExitingContainer)
          
          this.distanceTraveled = x - this.startingPosition;
  
          const direction = this.setDirection();
          
          this.xPosition = direction === "right" ? this.xPositionBeforeItLeft + this.distanceTraveled : this.xPositionBeforeItLeft - Math.abs(this.distanceTraveled);
          // console.log(this.xPositionBeforeItLeft + this.distanceTraveled, direction, this.xPosition);
          if(this.xPosition > max) {
            this.xPosition = max;
          } else if(this.xPosition < 0) {
            this.xPosition = 0;
          }
          
          // console.log("How the fuck does xPosition become 0 when 4 lines above it has the correct value?");
      } else {
        this.startingPosition = null;
        this.xPositionBeforeItLeft = null;
        this.lastElementBeforeExitingContainer = null;
        x = this.#getXPosition(e, e.target)
        if(this.xPosition > max) {
          this.xPosition = max;
        } 
        
        this.xPosition = x;
      }
      
      if(this.cropper && this.cropper !== undefined) this.#cropperZoomFunction()
      this.progress.style.setProperty("--widthVal", `${this.xPosition}px`);
      this.ball.style.transform = `translate(${this.xPosition}px, -50%)`;
    }
  }

  #cropperZoomFunction() {
      const { rangeWidth } = this.#getMaxRange();
      const zoomLimit = this.cropperZoomLimit - this.zoomStartsFrom;
      console.log(this.zoomStartsFrom);
      const multiplyVal = zoomLimit / (rangeWidth / 100);
      this.cropper.zoomTo((this.xPosition / 100) * multiplyVal + this.zoomStartsFrom)
  }


  setRangeCropperZoom(zoomRatio) {
    console.log("zoomRation here calledah ", zoomRatio)
    if(!this.zoomStartsFrom) this.zoomStartsFrom = zoomRatio > 0.4 ? 0.2 : zoomRatio;
    console.log(zoomRatio * 100)
    zoomRatio = zoomRatio - this.zoomStartsFrom;
    const { max, rangeWidth } = this.#getMaxRange();
    
    const multiplyBy = (rangeWidth / 100) / (this.cropperZoomLimit);
    let val = ((zoomRatio * 100)) * (multiplyBy + this.zoomStartsFrom);

    if(val > rangeWidth + (this.zoomStartsFrom * 100)) {
      console.log(val, rangeWidth + (this.zoomStartsFrom * 100))
      val = max
    } else if(val < 0) {
      val = 0;
    }

    this.progress.style.setProperty("--widthVal", `${val}px`);
    this.ball.style.transform = `translate(${val}px, -50%)`
  }

  #getMaxRange() {
    const rangeWidth = this.range.offsetWidth;
    const max = rangeWidth - (this.ball.offsetWidth / 2);

    return { max, rangeWidth };
  }


  #hoverMyBall(e) {
    // cuz everything inside range needs to have pointer events none so you can't hover her
    const ballWidth = this.ball.offsetWidth;
    let x = this.#getXPosition(e, e.target);
    
    let low = this.xPosition - ballWidth;
    let high = this.xPosition + ballWidth;

    if(x >= low && x <= high) {
      !this.ball.classList.contains("hover") && this.ball.classList.add("hover")
    } else {
      this.ball.classList.contains("hover") && this.ball.classList.remove("hover")
    }
  }
}