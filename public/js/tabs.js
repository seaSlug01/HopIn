export const targetTab = {
  prev: null,
  current: null
}


export function getUrlHash() {
  let hash = new URL(window.location).hash;
  hash === "" ? hash = "posts" : hash = hash.slice(1);
  return hash
}

export function addHash(hash) {
  window.location.hash = hash;
}

// that kind of works if there are only 2 tabs
export function addActiveClass(e) {
  targetTab.prev = targetTab.current;
  targetTab.current = e.target;
  if (targetTab.prev) {
    targetTab.prev.classList.remove("active");
  }
  targetTab.current.classList.add("active");
}

export function activeBasedOnSearchParams(tab, container) {
  if(!tab) tab = "top";
  const tabActive = container.querySelector(`[data-tab="${tab}-tab"]`);
  tabActive.classList.add("active")
}

export function getTargetTab(e) {
  const url = e.target.getAttribute("href").split("/");
  return url[url.length - 1];
}

