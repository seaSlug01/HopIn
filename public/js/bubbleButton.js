export class BubbleButton {
  constructor(elem, background, size = 25) {
    this.el = elem;

    this.el.addEventListener("click", e => {
      let rect = e.target.getBoundingClientRect();
      const bubble = document.createElement("div");
      bubble.style.width = `${size}px`
      bubble.style.height = `${size}px`
      bubble.classList.add("bubbleButton__bubble");

      let x = e.clientX - rect.left - (size / 2);
      let y = e.clientY - rect.top - (size / 2);
      
      
      this.el.appendChild(bubble);
      bubble.style.top = `${y}px`;
      bubble.style.left = `${x}px`;
      bubble.style.backgroundColor = background;

      bubble.addEventListener("animationend", () => {
        bubble.remove();
      })
    })
  }
}