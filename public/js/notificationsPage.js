import {docReady, createSpinner, elements, timeDifference} from "./common.js";

document.querySelector(".navigate").addEventListener("click", e => window.location.href = window.location.origin);

docReady(() => {
  markAllAsRead();
  createSpinner(elements.postsContainer);
  displayNotifications(notificationsDB)
})

function markAllAsRead() {
  const button = document.createElement("button");
  button.setAttribute("data-toggle", "tooltip");
  button.setAttribute("data-title", "Mark all as read");
  button.setAttribute("data-tooltip-type", "large");
  button.innerHTML = `<i class="fa-solid fa-align-center"></i>`;
  button.classList.add("markAllAsRead");

  document.querySelector(".header h1").appendChild(button);
}

function notificationTemplate(notificationId, userFrom, linkTo, text, opened, createdAt) {
  const container = document.createElement("a");
  container.classList.add("notification");
  !opened && container.classList.add("active");
  container.href = linkTo;
  container.setAttribute("data-notification-id", notificationId);

  const profilePic = document.createElement("img");
  profilePic.classList.add("profilePic");
  profilePic.src = userFrom.profilePic;

  const textEl = document.createElement("p");
  textEl.textContent = text;
  
  const time = document.createElement("span");
  time.classList.add("muted");
  time.textContent = ` - ${timeDifference(new Date(), new Date(createdAt))}`
  textEl.appendChild(time)

  elements.postsContainer.appendChild(container);

  [profilePic, textEl].forEach(el => container.appendChild(el));

}

function createNotification(n) {
  const {userTo, userFrom, notificationType, opened, entityId, createdAt, _id: notificationId } = n;
  let text = `${userFrom.firstName} ${userFrom.lastName}`.trim();
  let linkTo = `/posts/${entityId}`

  switch(notificationType) {
    case "reply":
      text = text + " replied to you."
      break;
    case "share":
      text = text + " shared your post."
      break;
    case "follow":
      if(userLoggedIn.following.includes(userFrom._id)) {
        text = text + " followed you back."
      } else {
        text = text + " followed you."
      }
      linkTo = `/profile/${userFrom.username}`;
    break;
    case "mention":
      text = text + " mentioned you in a post.";
      break;
    case "like":
      text = text + " liked your post."
  }

  notificationTemplate(notificationId, userFrom, linkTo, text, opened, createdAt)

}

function noNotifications() {
  const span = document.createElement("h3");
  span.classList.add("noNotificationsMessage")
  span.classList.add("muted")
  span.textContent = "You have no notifications";
  elements.postsContainer.appendChild(span);
}

function displayNotifications(ens) {
  document.querySelector(".spinnerContainer").remove();
  if(!ens.length) {
    return noNotifications()
  }

  for(let notification of ens) {
    createNotification(notification);
  }
}

window.addEventListener("click", async e => {
  try {
    if(e.target.classList.contains("notification")) {
      e.preventDefault();
  
      if(e.target.classList.contains("active")) {
        await axios.put(`/api/notifications/${e.target.dataset.notificationId}`)
      }
      e.target.classList.remove("active");
  
      window.location.href = e.target.href;
    } else if(e.target.classList.contains("markAllAsRead")) {
      await axios.put(`/api/notifications/all`)
      elements.postsContainer.querySelectorAll(".notification.active").forEach(n => n.classList.remove("active"))
      document.querySelector(`#sidebar-navigation .notifications .capsule .notificationsCount`)?.remove();
    }
  } catch(error) {
    console.error(error)
  }
})