import { docReady, elements, followUserActions, createSpinner, AppState, goBack, outPutFollowersFollowing, mimicAncherTag, appendToHeader, displayUserDetailsWindow } from "./common.js";
import { targetTab, getTargetTab, addActiveClass } from "./tabs.js"

document.querySelector(".navigate").addEventListener("click", goBack);

const tabsContainer = document.querySelector(".tabsContainer");
window.addEventListener("popstate", goBack)

appendToHeader(tabsContainer)

docReady(async () => {
  const url = window.location.href.split("/");
  const targetLink = url[url.length - 1];
  loadFollowersOrFollowing(targetLink);
  document.querySelector(`.${targetLink}-tab`).classList.add("active");
  targetTab.current = document.querySelector(`.${targetLink}-tab`);

  elements.postsContainer.addEventListener("mouseover", e => displayUserDetailsWindow(e, AppState[window.location.pathname.split("/").pop()], 600))
})

const emptyMsg = {
  userLoggedInNoFollowers: `<div class="no-results">
                              <h1>You don't have any followers yet</h1>
                              <p class="muted">When someone follows you, you’ll see them here.</p>
                            </div>`,
  userLoggedInNoFollowings: `<div class="no-results">
                                <h1>You aren’t following anyone yet</h1>
                                <p class="muted">When you do, they’ll be listed here and you’ll see their Tweets in your timeline.</p>
                            </div>`,
  profileUserNoFollowers: `<div class="no-results">
                              <h1>@${profileUsername} isn't followed by anyone</h1>
                              <p class="muted">When someone follows them, they'll be listed here.</p>
                          </div>`,
  profileUserNoFollowings: `<div class="no-results">
                              <h1>@${profileUsername} isn’t following anyone</h1>
                              <p class="muted">When they do, they’ll be listed here.</p>
                          </div>`
}

function createEmptyMsg(target) {
  let msg;

  if (profileUserId == userLoggedIn._id) {

    if (target === "followers") {
      msg = emptyMsg.userLoggedInNoFollowers
    }

    if (target === "following") {
      msg = emptyMsg.userLoggedInNoFollowings
    }

    return msg;

  } else {
    if (target === "followers") {
      msg = emptyMsg.profileUserNoFollowers
    }

    if (target === "following") {
      msg = emptyMsg.profileUserNoFollowings
    }

    return msg;
  }


}

async function loadFollowersOrFollowing(target) {
  createSpinner(elements.postsContainer, true)
  await axios.get(`/api/users/${profileUserId}/${target}`).then(res => {
    const users = res.data[target];
    AppState[target] = res.data[target];
    if (users.length > 0) {
      outPutFollowersFollowing(users, elements.postsContainer, true, true)
      AppState[target] = res.data[target];
    } else {
      const emptyMsg = createEmptyMsg(target);
      elements.postsContainer.innerHTML = "";
      elements.postsContainer.insertAdjacentHTML("beforeend", emptyMsg);
    }
  })
}

elements.postsContainer.addEventListener("click", async e => followUserActions.call(e.target.closest(".postContainer"), e))

elements.tabsContainer.addEventListener("click", async (e) => {
  if (e.target.classList.contains("tab-link")) {
    e.preventDefault();

    if (e.target.classList.contains("active")) return;

    const targetTab = getTargetTab(e);
    const url = window.location.href.split("/");
    const newUrl = url.slice(0, url.length - 1).join("/") + "/" + targetTab;
    window.history.pushState({}, targetTab, newUrl);

    if(AppState[targetTab].length) {
      addActiveClass(e);
      outPutFollowersFollowing(AppState[targetTab], elements.postsContainer)
    } else {
      addActiveClass(e);
      loadFollowersOrFollowing(targetTab)
    }
  } 
})


// document.querySelector(".postsContainer").addEventListener("click", e => {
//   if(e.target.closest(".userContainer")) {
//     const userContainer = e.target.closest(".userContainer");
//     const userId = userContainer.getAttribute("data-user-id");
//     let selectorsAreValid = validSelectors(e.target, [userContainer.querySelector("followButton")])
//       if (userId && selectorsAreValid) {
//         window.location.href = "/profile/" + userId;
//     }
//   }
// })

document.querySelector(".postsContainer").addEventListener("click", e => {
  if(e.target.tagName.toLowerCase() !== 'a') {
    const excludedSelectors = Array.from(e.target.closest(".userContainer").querySelectorAll(".followButton"))
    const extraConditions = !e.target.classList.contains("userDetails") && !e.target.classList.contains("profile-and-follow") && !e.target.classList.contains("bio") && !e.target.classList.contains("userDetails-window") && !e.target.classList.contains("followersContainer");
    mimicAncherTag(e, "userContainer", "data-user-id", "/profile/", excludedSelectors, extraConditions)
  }
});








