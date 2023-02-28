import {docReady} from "./common.js";

docReady(async () => {
  const { data: notifications } = await axios.get("/api/notifications");
  for(let propName of Object.keys(notifications)) {
    addNotificationCount(notifications[propName], propName)
  }

})

function addNotificationCount(notificationsCount, target) {
  if(notificationsCount) {
    const count = document.createElement("span");
    count.classList.add("notificationsCount");
    count.textContent = notificationsCount;
    if(notificationsCount >= 10) count.classList.add("auto");
    
    document.querySelector(`#sidebar-navigation .${target} .capsule`).appendChild(count)
  }
}