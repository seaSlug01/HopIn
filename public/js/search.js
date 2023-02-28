import {outputSearchResults, validSelectors, appendToHeader, elements, outputPosts, outPutFollowersFollowing, createSpinner, AppState, sortSearchHistory } from "./common.js"
import {activeBasedOnSearchParams} from "./tabs.js";
const searchBox = document.querySelector(".searchBox");
const searchResultsBox = searchBox.querySelector(".searchBox__results");
const scrollableResults = searchResultsBox.querySelector(".scrollable");
export const searchInput = document.getElementById("searchInput");
const cancelSearchButton = document.querySelector(".searchCancelButton");
const searchForm = document.getElementById("searchForm");

let lastCharCount = 0
let searchTimer = null;
let searchAjaxRequest = null;

export function constructURL(locationHref) {
  return new URL(locationHref);
}

export function removeQueryParams(url, name) {
  url.searchParams.delete(name);
  window.history.pushState(null, '', url.toString());
}

export function createNoResultsHTML(container, searchTerm) {
  container.innerHTML = "";
  const html =  `<div class="not-found-details">
                  <div class="not-found-details__description">
                    <div class="not-found-details__no-results-illustration"></div>
                    <h2>No results for</h2>
                    <h2>"${searchTerm}"</h2>
                    <p class="muted">Try searching for something else, or check if you misspelled something.</p>
                  </div>
                </div>`
  container.insertAdjacentHTML("afterbegin", html);
}

export function outputDataBasedOnTab(tab, data, searchTerm) {
  switch(tab) {
    case "people":
      data.people.length >= 1 ? outPutFollowersFollowing(data.people, elements.postsContainer, true) : createNoResultsHTML(elements.postsContainer, searchTerm)
      break;
    case "recent": 
      data.recent.length >= 1 ? outputPosts(data.recent, elements.postsContainer, true) : createNoResultsHTML(elements.postsContainer, searchTerm)
      break;
    default: 
      data.topResults.length >= 1 ? outputPosts(data.topResults, elements.postsContainer, true) : createNoResultsHTML(elements.postsContainer, searchTerm)
  }
}

export function addQueryParams(url, name, value) {
  url.searchParams.set(name, value);
  window.history.pushState(null, '', url.toString());
}

export async function searchRequest(tab, searchTerm) {
  // input dom removing active classes and some icons
  searchInput.blur();
  removeClasses();
  // add tabs if they're hidden
  if(elements.tabsContainer.classList.contains("d-none")) {
    elements.tabsContainer.classList.remove("d-none")
    appendToHeader(elements.tabsContainer)
  }

  activeBasedOnSearchParams(tab, elements.tabsContainer)
  const response = await axios.get("/search/q", {params: {search: searchTerm}});
  arrangeDataFrontEnd(response.data, searchInput.value.trim());
  
  outputDataBasedOnTab(tab, AppState.searchResults, searchInput.value.trim())
}

export function orderData(data) {
  return data.sort((a,b) => b.timesMatched - a.timesMatched);
}

function addPointsToBestMatchedUser(people, topPosts) {
  let acc = {};

  // getting the top posts that are accosiated with a user
  // ignoring the ones that have equal or less points if the user has multiple top posts
  // just getting the first one, with the higher score (timesMatched)
  for(let doc of topPosts) {
    if(acc[doc.postedBy._id]) {
      const post = acc[doc.postedBy._id];
      if(!post.timesMatched > doc.timesMatched) {
        return
      } else {
        acc[doc.postedBy._id] = doc;
      }
    }
    else {
      acc[doc.postedBy._id] = doc;
    }
  }

  // we add the posts points to the user
  // so that when we go to the users tab, we see that user first
  // there were some cases that even if the user had first topPost
  // he was second or third in the users tab
  // he should be seen first
  for(let key in acc) {
    const user = people.find(user => user._id === acc[key].postedBy._id)
    if(user) {
      const timesMatched = acc[key].timesMatched;
      user.timesMatched = user.timesMatched + timesMatched;
    }
  }
}

function arrangeDataFrontEnd(data, searchTerm) {
  const orderTopPosts = orderData(data.topResults.concat(data.posts));
  
  addPointsToBestMatchedUser(data.people, data.topResults.concat(data.posts))
  const orderPeople = orderData(data.people);

  const orderPostsByDate = data.topResults.concat(data.posts).sort((a,b) => {
    console.log("Here", new Date(b.createdAt) - new Date(a.createdAt))
    return new Date(b.createdAt) - new Date(a.createdAt)
  });
  AppState.searchResults = {
    topResults: orderTopPosts,
    recent: orderPostsByDate,
    people: orderPeople
  };

  console.log(AppState.searchResults.people)
  AppState.searchTerm = searchTerm;
}



function goToProfile(searchTerm) {
  if(searchTerm.trim().split(" ").length < 2) {
    const goToUserName = document.createElement("a");
    goToUserName.classList.add("searchAnyway");
    goToUserName.classList.add("goTo");
    goToUserName.setAttribute("href", `/profile/${searchTerm}`)
    goToUserName.textContent = `Go to @${searchTerm}`;
    scrollableResults.append(goToUserName);
  }
}

function searchForLink(searchTerm) {
    const searchLink = document.createElement("a");
    searchLink.classList.add("searchAnyway");
    searchLink.classList.add("searchFor");
    searchLink.setAttribute("href", `/search?q=${searchTerm}`)
    searchLink.textContent = `Search for "${searchTerm}"`;
    scrollableResults.prepend(searchLink);
}

function setSearchDescription(instruction) {
  scrollableResults.innerHTML = "";
  const searchDesc = document.createElement("p");
  searchDesc.classList.add("search-instructions");
  searchDesc.textContent = instruction
  scrollableResults.append(searchDesc);
}

function createLoadingBar() {
  deleteLoadingBar();
  const loadingBar = document.createElement("div");
  const bar = document.createElement("div");
  console.log("creating loading bar")
  loadingBar.classList.add("loading");
  bar.classList.add("bar");

  loadingBar.append(bar);
  searchResultsBox.append(loadingBar);
  setTimeout(() => {
    const bar = document.querySelector(".bar") || null;
    if(bar) {
      bar.style.animationName = "loading2";
    }
  }, 1500)
}

function deleteLoadingBar() {
  const loadingBar = document.querySelector(".loading") || null;
  if(loadingBar) loadingBar.remove();
}


function regularSearchItem(historyItem) {
  return `<a href="/search?q=${historyItem.id}" class="searchHistoryItem" data-id="${historyItem.id}" data-type="${historyItem.searchType}">
            <div class="left"><i class="fa-solid fa-magnifying-glass"></i></div>
            <div class="middle ellipsis">${historyItem.id}</div>
            <button class="btn-icon delete-history-item" type="button">&#10005;</button>            
          </a>`
}



function userSearchItem(historyItem) {
  const {id, searchType, additionalData: {image, username, fullName}} = historyItem;
  console.log(username)
  return `<a href="/profile/${username}" class="searchHistoryItem ${searchType}" data-id="${id}" data-type="${searchType}">
            <div class="left"><img class="profileImage" src="${image}"></img></div>
            <div class="middle ellipsis">
              <p>
                ${fullName}
              </p>
              <p class="muted">
                @${username}
              </p>
            </div>
            <button class="btn-icon delete-history-item" type="button">&#10005;</button>            
          </a>`
}

function createSearchItems(container, items) {
  container.innerHTML = "";

  container.insertAdjacentHTML("afterbegin", 
  `<div class="searchHistoryHeader">
    <h3 class="heading">Recent</h3>
    <button class="btn-icon clearHistory" type="button">Clear all</button>
  </div>`)

  items.forEach(item => {
    let html;
    if(item.searchType === "regular") {
      html = regularSearchItem(item);
    } else if(item.searchType === "user") {
      html = userSearchItem(item)
    }
    container.insertAdjacentHTML("beforeend", html)
  })
}


scrollableResults.addEventListener("click", async e => {
  const isRegularHistoryItem = e.target.classList.contains("searchHistoryItem") && !e.target.classList.contains("user");
  const isUserHistoryItem = e.target.classList.contains("searchHistoryItem") && e.target.classList.contains("user");

  if(isRegularHistoryItem || isUserHistoryItem) {
    let id = e.target.dataset.id;
    let type = e.target.dataset.type;

    if(isRegularHistoryItem) {
      const isSearchPage = window.location.href.includes("search")
      if(isSearchPage) {
        console.log("Are we prevented by something?")
        e.preventDefault();
        const targetURL = constructURL(e.target.href);
        const pageURL = constructURL(window.location.href);

        try {
          addQueryParams(pageURL, "q", targetURL.search.split("=")[1])
          await searchRequest(pageURL.searchParams.get("t"), pageURL.searchParams.get("q"))
        } catch(error) {
          console.log(error);
        }
      }
    }

    await updateHistory(id, type);
  }
})

scrollableResults.addEventListener("click", async e => {
  const btnDeleteSingleItem  = e.target.classList.contains("delete-history-item");
  const btnClearAllHistory = e.target.classList.contains("clearHistory")

  if(btnDeleteSingleItem) {
    e.preventDefault();
    const historyItem = e.target.closest(".searchHistoryItem");
    console.log(historyItem)
    const index = [scrollableResults].indexOf(historyItem);
    const id = historyItem.dataset.id;
    
    try {
      await axios.put("/search/deleteHistory/" + id);
      historyItem.remove();
      AppState.searchHistory.splice(index, 1)
      if(!AppState.searchHistory.length) setSearchDescription("Try searching for people, topics, or keywords")
    } catch(error) {
      console.log(error);
    }
  } else if(btnClearAllHistory) {
    await axios.delete("/search/deleteHistory");
    AppState.searchHistory = [];
    setSearchDescription("Try searching for people, topics, or keywords")
  }
})


searchInput.addEventListener("focus", e => {
  searchBox.classList.add("focus");
  if(e.target.value.trim() === "") {
    AppState.searchHistory.length ? createSearchItems(scrollableResults, AppState.searchHistory) : setSearchDescription("Try searching for people, topics, or keywords")
    return;
  }
  if(e.target.value !== "") {
    cancelSearchButton.classList.remove("d-none")
  }
})

function removeClasses() {
  searchBox.classList.remove("focus");
  cancelSearchButton.classList.add("d-none");
  searchResultsBox.classList.add("d-none");
}

searchInput.addEventListener("blur", e => {
  // if(cancelSearchButton.classList.contains("d-none")) {
  //   console.log("It contains d-none so everything gonna disappear")
  //   console.log(scrollableResults.children.length)
  // } else {
  //   console.log("It doesn't")
  // }
  // this logic is going to be a pain in the ass to debug in a few years
  cancelSearchButton.classList.contains("d-none") && !scrollableResults.children.length > 1 ? removeClasses() : setTimeout(() => cancelSearchButton.classList.add("d-none"), 100)
})


searchInput.addEventListener("keyup", async e => {
  clearTimeout(searchTimer)
  // this token should be created outside the setTImeout
  searchAjaxRequest = axios.CancelToken.source();
  e.target.value !== "" ? cancelSearchButton.classList.remove("d-none") : cancelSearchButton.classList.add("d-none");

  if(e.target.value.trim() !== "") {
    searchTimer = setTimeout(async () => {
      
      const results = await axios.get("/search/users", {params: {searchInput: e.target.value }, cancelToken: searchAjaxRequest.token});
      outputSearchResults(results.data, searchResultsBox.querySelector(".scrollable"))
      goToProfile(e.target.value)
      searchForLink(e.target.value)
      document.querySelector(".loading") && document.querySelector(".loading").remove();
      lastCharCount = e.target.value.trim().length;
    }, 1000)
  }
  
})


searchInput.addEventListener("input", e => {
  const valueLength = e.target.value.trim().length;
  if(valueLength == 1 || (valueLength > lastCharCount && valueLength <= lastCharCount + 2)) {
    console.log(valueLength == 1, (valueLength > lastCharCount && valueLength < lastCharCount + 2), valueLength, lastCharCount)
    createLoadingBar();
  } else if(e.target.value == "") {
    console.log(valueLength == 1, (valueLength > lastCharCount && valueLength < lastCharCount + 2), valueLength, lastCharCount)
    document.querySelector(".loading") && document.querySelector(".loading").remove();
  }
})

// HERE
searchInput.addEventListener("focus", e => {
  searchResultsBox.classList.remove("d-none")
  searchBox.classList.add("focus");
  if(AppState.searchHistory.length && e.target.value.trim() === "") {
    createSearchItems(scrollableResults, AppState.searchHistory);
    return;
  }
  if(e.target.value !== "") {
    cancelSearchButton.classList.remove("d-none")
  }
})

cancelSearchButton.addEventListener("click", e => {
  if(searchAjaxRequest) {
    console.log(searchAjaxRequest)
    searchAjaxRequest.cancel();
  }
  console.log("am i geting clicked?")
  cancelSearchButton.classList.add("d-none")
  deleteLoadingBar()
  searchInput.value = "";
  searchInput.focus();
  AppState.searchHistory.length ? createSearchItems(scrollableResults, AppState.searchHistory) : setSearchDescription("Try searching for people, topics, or keywords")
})

window.addEventListener("click", e => {
  if(e.target.classList.contains("searchForm")) {
    searchInput.focus();
    setTimeout(() => cancelSearchButton.classList.remove("d-none"), 100)
    return;
  }

  let selectorsAreValid = validSelectors(e.target, [searchInput, searchBox, searchBox.querySelector("label"), cancelSearchButton ])
  if(selectorsAreValid && !e.target.closest(".searchBox__results") && !e.target.classList.contains("searchForm") && !e.target.classList.contains("searchHistoryItem")) {
    searchBox.classList.remove("focus");
    searchResultsBox.classList.add("d-none")
  }

})


async function updateHistory(textInput, type) {
  const { data: {searchHistory}} = await axios.post("/search/history", {id: textInput, type})
  AppState.searchHistory = sortSearchHistory(searchHistory);
}

searchForm.addEventListener("submit", async e => {
  e.preventDefault();

  if(window.location.href.includes("search")) {
    if(searchInput.value.trim() !== "") {
      const url = constructURL(window.location.href)
      const tab = url.searchParams.get("t")
      createSpinner(elements.postsContainer)
      await searchRequest(tab, searchInput.value.trim());
      await updateHistory(searchInput.value.trim(), "regular");
      addQueryParams(url, "q", searchInput.value.trim())  
    }
  } else {
    await updateHistory(searchInput.value.trim(), "regular");
    window.location.href = window.location.origin + "/search?q=" + searchInput.value.trim();
  }
})
