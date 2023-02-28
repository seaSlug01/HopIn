// NEEDS GSAP

export class Accordion {


  constructor(el, headerText, options) {
    this.options = {...this.defaultOptions(), ...options}
    this.el = el;
    this.headerText = headerText;
    this.setVisibilityTimer = null;

    this.create();

    this.options.init(this)
    this.el.querySelector(".accordion__header").addEventListener("click", e => this.toggleBody(e))
  }

  defaultOptions() {
    return {
      active: false,
      init: () => {},
      callback: () => {},
      additionalClasses: ""
    }
  }

  toggleBody(e) {
    clearTimeout(this.setVisibilityTimer)
    const headerHeight = e.target.offsetHeight;
    const body = e.target.nextElementSibling;
    this.el.classList.toggle("active");

    if(this.el.classList.contains("active")) {
      this.el.style.height = `${headerHeight + body.offsetHeight}px`
      gsap.fromTo(this.el, {height: headerHeight}, {height: headerHeight + body.offsetHeight, duration: 1, ease: Elastic.easeOut.config(1, 0.3)})
      body.style.visibility = "visible"
      this.options.callback(this);
    } else {
      
      this.el.style.height = `${headerHeight}px`
      gsap.fromTo(this.el, {height: headerHeight + body.offsetHeight}, {height: headerHeight, duration: 0.6, ease: Bounce.easeOut})
      this.setVisibilityTimer = setTimeout(() => {
        body.style.visibility = "hidden"
      }, 600)
    }

  }

  create() {
    this.options.active && this.el.classList.add("active");
    if(this.options.additionalClasses !== "") {
      console.log("They not empty")
      this.options.additionalClasses.split(" ").forEach(cl => this.el.classList.add(cl))
    }
    

    const upperPart = document.createElement("button");
    upperPart.classList.add("accordion__header")
    upperPart.innerHTML = `<span>${this.headerText}</span> <div class="accordion__header__icon"><i class="fa-solid fa-angle-down"></i></div>`;

    const lowerPart = document.createElement("div");
    lowerPart.classList.add("accordion__body");
    if(!this.options.active) lowerPart.style.visibility = "hidden";

    [upperPart, lowerPart].forEach(part => {
      this.el.appendChild(part);
    })
  }
}