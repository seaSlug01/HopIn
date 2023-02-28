export let connected = false;

export const socket = io()

socket.emit("setup", userLoggedIn);

socket.on("connected", () => {
  connected = true;
})

window.addEventListener("load", e => {
  console.log("LOAD")
  let userExitedChatRoomEvent = window.localStorage.getItem("userExitedChatRoom");
  
  
  if(userExitedChatRoomEvent) {
    userExitedChatRoomEvent = JSON.parse(userExitedChatRoomEvent);
    const {chatId, userId} = userExitedChatRoomEvent;
    socket.emit("userExitedChatRoom", {room: chatId, userId: userId})
    window.localStorage.removeItem("userExitedChatRoom")
  }
})




