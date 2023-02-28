import { docReady, elements, createSpinner, AppState, mimicAncherTagDescriptive, displayUserDetailsWindow } from "./common.js"
import {constructURL, searchRequest, removeQueryParams, addQueryParams, outputDataBasedOnTab, searchInput} from "./search.js"

document.querySelector(".navigate").addEventListener("click", () => window.location.href = window.location.origin);

const searchPage = document.getElementById("searchPage");

searchPage.addEventListener("click", async e => {
  mimicAncherTagDescriptive(e, "userContainer", [], true)
})

docReady(async () => {
  let url = constructURL(window.location.href);
  let queryParams = url.searchParams.get("q");
  searchInput.value = queryParams;
  let tab = url.searchParams.get("t");
  addHrefAttributeToEachTag(elements.tabsContainer.querySelectorAll(".tab-link"))

  if(queryParams) {
    createSpinner(elements.postsContainer, true)

    try {
      await searchRequest(tab, queryParams)
    } catch(error) {
      console.log(error);
    } 
  }

  
})

function getSearchStateName() {
  let tab = constructURL(window.location.href).searchParams.get("t");
  // thats cuz I suck, I named the state with different keywords...
  if(!tab) return "topResults"
  if(tab == "latest") {
    return "recent";
  }
  return tab
}


elements.postsContainer.addEventListener("mouseover", _.throttle(e => displayUserDetailsWindow(e, AppState.searchResults[getSearchStateName()]), 300))

function addHrefAttributeToEachTag(tabLinks) {
  tabLinks.forEach((tab, i) => {
    const link = new URL(window.location.origin + "/search");
    // link.searchParams.append('q', queryParams);
    const tabName = tab.classList[1].split("-")[0];
    if(i != 0) {
      link.searchParams.append('t', tabName);
    }
    
    tab.href = link;
  })
}

elements.tabsContainer.addEventListener("click", e => {
  e.preventDefault();
  e.target.closest(".tabsContainer").querySelector(".active").classList.remove("active");
  e.target.classList.add("active");
  const tabName = e.target.classList[1].split("-")[0];

  outputDataBasedOnTab(tabName, AppState.searchResults, AppState.searchTerm)

  const url = constructURL(window.location.href);
  tabName === "top" ? removeQueryParams(url, "t") : addQueryParams(url, "t", tabName);
})


elements.tabsContainer.addEventListener("click", e => {
  e.preventDefault();
  e.target.closest(".tabsContainer").querySelector(".active").classList.remove("active");
  e.target.classList.add("active");
  const tabName = e.target.classList[1].split("-")[0];

  outputDataBasedOnTab(tabName, AppState.searchResults, AppState.searchTerm)

  const url = constructURL(window.location.href);
  tabName === "top" ? removeQueryParams(url, "t") : addQueryParams(url, "t", tabName);
})
