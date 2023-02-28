import {getCursorPos} from "./common.js";

export class EmojiSelection {
  constructor(toggle, searchInputId, targetTextarea, resizable = false, limit) {
    this.toggle = toggle;
    this.targetTextarea = targetTextarea
    this.parentEl = toggle.parentElement;
    this.emojis = {};
    this.searchInputId = searchInputId
    this.resizable = resizable;

    this.suggestions = null;
    this.searchResults = null;
    this.body = null;
    this.footer = null;
    this.searchTimeout = null;
    this.scrollTimeout = null;
    this.valueLength = {
      prev: 0,
      cur: 0
    }
    this.cursorPosition = {start: 0, end: 0};
    this.limit = limit;

    this.setEmojiListHTML()

    this.targetTextarea.addEventListener("click", e => {
      this.updateValueLength();
      this.setCursorPosition(e)
    });

    this.targetTextarea.addEventListener("input", e => {
      this.updateValueLength();
      this.setCursorPosition(e)
    })

    this.toggle.addEventListener("click", async (e) => {
      const emojiContainer = this.parentEl.querySelector(".emojiListContainer");
      emojiContainer.classList.contains("active") ? emojiContainer.classList.remove("active") : emojiContainer.classList.add("active")
      await this.setEmojiData();

      setTimeout(() => {
        document.getElementById(this.searchInputId).focus();
      }, 1)
    })

    document.getElementById(`${this.searchInputId}`).addEventListener("keyup", e => {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => this.searchEmojis(e), 200)
    })

    document.getElementById(`${this.searchInputId}`).addEventListener("keypress", e => {
      if(e.code === "Enter") {
        e.preventDefault();
      }
    })
    
    this.body.addEventListener("click", async e => {
      if(e.target.classList.contains("emoji")) {
        const emojiName = e.target.dataset.name;
        const response = await axios.get("/api/emojis/get/" + emojiName);
        const emoji = response.data;

        this.appendEmoji(emoji);

        if(this.resizable) {
          this.setContentEditableValue();
          this.resizeTextarea();
        }
      }
    })

    this.body.addEventListener("scroll", e => {
      clearTimeout(this.scrollTimeout);

      this.scrollTimeout = setTimeout(() => {
        const categories = this.suggestions.querySelectorAll(".emoji-category")

        for(let i = 0; i < categories.length; i++) {
          let elemHeight = categories[i].offsetHeight;
          let scrollTop = e.target.scrollTop;
          categories[i].classList.remove("active");
          const button = this.footer.querySelector(`button[data-scroll-to="${categories[i].getAttribute("id")}"]`);
          button.classList.remove("active")
          
          let elemTop = categories[i].offsetTop;
          
          let isVisible = scrollTop + 50 >= elemTop && scrollTop + 50 <= elemHeight + elemTop;

          if(isVisible) {
            button.classList.add("active")
          }
          
        }
      }, 100)
      
    })

    this.footer.addEventListener("click", e => {
      if(e.target.tagName.toLowerCase() === "button") {
        const targetCategory = this.suggestions.querySelector(`#${e.target.dataset.scrollTo}`);
        
        this.body.scrollTo(0, targetCategory.offsetTop - 30)
      }
    })

    
    window.addEventListener("click", e => {
      const parentElClass = this.parentEl.classList.value.split(" ")[0]

      if(!e.target.closest(`.${parentElClass}`)) {
        this.toggle.previousElementSibling.classList.remove("active")
      }
    })
  }

  updateValueLength() {
    this.valueLength.prev = !this.targetTextarea.value.length ? 0 : this.valueLength.cur;
    this.valueLength.cur = this.targetTextarea.value.length;
  }

  appendEmoji(emoji) {

    if(this.cursorPosition.start >= this.targetTextarea.value.length - 1) {
      this.targetTextarea.value = this.targetTextarea.value + emoji;
    } else if(this.targetTextarea.value.length - 1 >= this.cursorPosition.start) {
      const firstPart = this.targetTextarea.value.substring(0, this.cursorPosition?.start || 0);
      const secondPart = this.targetTextarea.value.substring(this.cursorPosition?.start || 0, this.targetTextarea.value.length);
      this.targetTextarea.value = firstPart + emoji + secondPart;
    }

    this.targetTextarea.closest("form").querySelector("button[type='submit'").disabled = false;
    this.updateValueLength();
    this.updateCursorPositionAfterEmojiIsAdded();
  }

  updateCursorPositionAfterEmojiIsAdded() {
    let addedCursorPoints = this.valueLength.cur - this.valueLength.prev;

    console.log(this.cursorPosition.start);
    this.cursorPosition.start = this.cursorPosition.start + addedCursorPoints;
    console.log(this.cursorPosition.start, addedCursorPoints);
  }

  setCursorPosition(e) {
    console.log("Whats calling me")
    if(!e.target.value) {
      console.log("if yo")
      this.cursorPosition = {start: 0, end: 0}
      
    }
    this.cursorPosition = getCursorPos(e.target);
  }

  setEmojiListHTML() {
    this.parentEl.style.position = "relative";

    let html = `<div class="emojiListContainer">
                  <div class="emojiHeader sticky">
                    <div class="searchFormGroup">
                      <label for="${this.searchInputId}">
                        <i class="fa-solid fa-magnifying-glass"></i>
                      </label>
                      <input type="text" placeholder="Search emoji" id="${this.searchInputId}" autocomplete="off" />
                    </div>
                  </div>
                  <div class="emojiBody">
                    <div class="suggestions">

                    </div>
                    <ul class="emoji-searchResults d-none">

                    </ul>
                  </div>
                  <div class="emojiFooter">
                    <button type="button" data-scroll-to="emoji-smileys" data-toggle="tooltip" data-title="Smileys" data-tooltip-type="large" class="active"><i class="fa-solid fa-face-smile"></i></button>
                    <button type="button" data-scroll-to="emoji-symbols" data-toggle="tooltip" data-title="Symbols" data-tooltip-type="large"><i class="fa-solid fa-icons"></i></button>
                  </div>
                </div>`

    this.parentEl.insertAdjacentHTML("afterbegin", html);

    this.footer = this.parentEl.querySelector(".emojiFooter");
    this.body = this.parentEl.querySelector(".emojiBody");
    this.suggestions = this.body.querySelector(".suggestions");
    this.searchResults = this.body.querySelector(".emoji-searchResults");
  }

  async searchEmojis(e) {
    if(e.target.value.trim() !== "") {
      this.suggestions.classList.add("d-none");
      this.searchResults.classList.remove("d-none")
      const results = await axios.get(`/api/emojis/search/${e.target.value.trim()}`)
      if(results.data.length) {
        this.createSearchResults(results.data);
      }
    } else {
      this.suggestions.classList.remove("d-none")
      this.searchResults.classList.add("d-none")
    }
  }

  async setEmojiData() {
    if(!Object.keys(this.emojis).length) {
      const emojis = await axios.get("/api/emojis")
      this.emojis = emojis.data;
      this.appendEmojis();

    }
  }

  createSearchResults(emojiResults) {
    this.searchResults.innerHTML = "";
    let html = "";
    emojiResults.forEach(({key, emoji}) => {
      html += this.emojiItem(key, emoji);
    })

    this.searchResults.insertAdjacentHTML("beforeend", html);
  }

  appendEmojis() { 
    for(let key in this.emojis) {
      this.createEmojiCategory(this.suggestions, this.emojis[key], key)
    }
  }

  createEmojiCategory(container, category, heading) {
    let html = `<ul class="emoji-category" id="emoji-${heading.toLowerCase()}">
                  <h5>${heading}</h3>`
    for(let key in category) {
      html += this.emojiItem(key, category[key]);
    }

    html += "<div>";

    container.insertAdjacentHTML("beforeend", html);
  }

  emojiItem(emojiName, emoji) {
    return `<li class="emoji" data-name="${emojiName}"><span>${emoji}</span></li>`;
  }

  setContentEditableValue() {
    const content = this.targetTextarea.nextElementSibling;
    if(this.limit) {
        this.limit.callback();  
    } else {
      content.innerHTML = this.targetTextarea.value;
    }
    
  }
  
  resizeTextarea() {
    const content = this.targetTextarea.nextElementSibling;
    this.targetTextarea.style.height = "5px";
    this.targetTextarea.style.height = this.targetTextarea.scrollHeight + "px";
    content.style.height = this.targetTextarea.offsetHeight + "px";
  }
}