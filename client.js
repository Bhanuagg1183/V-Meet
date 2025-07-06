const socket = io();

// const socket = io('/');



let Name = JSON.parse(sessionStorage.getItem("allNames"));

let textarea = document.querySelector("#textArea");
let msg;
let msgArea = document.querySelector("#msgSection");
let markup;
let sendBtn = document.getElementById("send");
let roomCtnr = document.getElementById("room-ctnr");
let ws;
let url;

if (msgArea != null) {
  if (Name == null || Name == "") {
    Name = "David Jeo";
  }
  sessionStorage.setItem("myName", JSON.stringify(Name));

  ws = window.location.pathname.split("/")[1];
  url = document.location.href;

  console.count(`${url}`);

  textarea.addEventListener("keyup", function (e) {
    if (e.keyCode === 13) {
      console.log(e.key);

      sendMessage(textarea.value);
    }

    document.getElementById("sendBtn").onclick = ()=>{
      
      sendMessage(textarea.value);
    }
    
  });
}

function sendMessage(message) {
  msg = {
    user: Name,
    message: message.trim(),
    url: ws,
  };

  appendMessage(msg, "outgoing");

  // send to server
  socket.emit("message", msg);
  scrollToBottom();
}

function appendMessage(msg, type) {
  let mainDiv = document.createElement("div");
  let ClassName = type;
  mainDiv.className = `${ClassName} message`;

  if (type === "outgoing") {
    if (msg.message !== "") {
      markup = `
                <p>${msg.message}</p>
              
                `;

      mainDiv.innerHTML = markup;

      msgArea.appendChild(mainDiv);

      textarea.value = "";
      new Audio("audio/msgSend.mp3").play()
    }
  } else {

    if (msg.message !== "") {
      markup = `
                <h2>${msg.user}</h2>
                <p>${msg.message}</p>
                `;

      mainDiv.innerHTML = markup;

      msgArea.appendChild(mainDiv);

       new Audio("audio/msgRec.mp3").play()
      textarea.value = "";
    }
  }
}

// room created
socket.on("room-created", (room, found) => {
  let roomLobby = document.createElement("div");
  roomLobby.className = `roomBlock roomBlockHBSBG`;
  let indexTopLeftRoomsName = document.getElementById("indexTopLeftRoomsName");
  {
    /* <div class="roomBlock"> */
  }
  let allRoomBlock = `

                <div class="roomName">
                <h1>${room}</h1>
                
                <div class="roomJoinBtn">
                <button class="button"><a href="/${room}">join</a></button>
                </div>
                </div>
                <div class="noOfUsers">
                <i class="material-icons" style="font-size: 48px">group</i>
                <h2></h2>
                </div>
                
                `;

  roomLobby.innerHTML = allRoomBlock;
  indexTopLeftRoomsName.appendChild(roomLobby);
});

// recieve msg

socket.on("message", (msg) => {
  appendMessage(msg, "incoming");
 
  scrollToBottom();
});

socket.emit("newUserJoin", Name, ws);

socket.on("UserJoin", (Name) => {
  if (Name != null) {
    append(`${Name} has joined the chat`);
    new Audio("audio/userjoin.mp3").play()
  }
});

socket.on("leftchatroom", (userName) => {
  console.log(userName + "this is msg");
  if (userName != null) {
    append(`${userName} has left the chat room`);
  }
});

function append(Name) {
  let userJoinCtnr = document.createElement("div");

  userJoinCtnr.className = `userjoin`;

  let markup = `
    <h3>${Name}</h3>
        `;

  userJoinCtnr.innerHTML = markup;

  msgArea.appendChild(userJoinCtnr);
  scrollToBottom();
}

function scrollToBottom() {
  msgArea.scrollTop = msgArea.scrollHeight;
}








const peer = new Peer();
let myVideoStream;
let myId;
var videoGrid = document.getElementById('videoDiv')
var myvideo = document.createElement('video');

myvideo.muted = true;

var VdoAdo = true

const peerConnections = {}



navigator.mediaDevices.getUserMedia({
  video:true,
  audio:true
  
  
  
}).then((stream)=>{
  myVideoStream = stream;
  addVideo(myvideo , stream);
  peer.on('call' , call=>{
    call.answer(stream);
    const vid = document.createElement('video');
    
    
      
      
      call.on('stream' , userStream=>{
      
        addVideo(vid , userStream);
    })


    // *********

    document.getElementById("toggle").onclick = () => {
      if (stream.getVideoTracks()[0].enabled) {
        console.log("onclick called");
        stream.getVideoTracks()[0].enabled = false;
        stream.getVideoTracks()[0].muted = false;
        
      } else {
        console.log("onclick called");
          stream.getVideoTracks()[0].enabled = true;
          stream.getVideoTracks()[0].muted = true;
          
      }
  }


  document.getElementById("toggleMic").onclick = () => {
    if (stream.getAudioTracks()[0].enabled) {
        stream.getAudioTracks()[0].enabled = false;
        stream.getAudioTracks()[0].muted = false;
       
    } else {
        stream.getAudioTracks()[0].enabled = true;
        stream.getAudioTracks()[0].muted = true;
        
    }
}

   
                    
                    

    call.on('error' , (err)=>{
      alert(err)
    })
    call.on("close", () => {
        console.log(vid);
        vid.remove();
    })
    peerConnections[call.peer] = call;
  })
}).catch(err=>{
    alert(err.message)
})




peer.on('open' , (id)=>{
  myId = id;
  socket.emit("newUser" , id , roomID);
})
peer.on('error' , (err)=>{
  alert(err.type);
});


socket.on('userJoined' , id=>{
  console.log("new user joined")
  const call  = peer.call(id , myVideoStream);
  const vid = document.createElement('video');
  call.on('error' , (err)=>{
    alert(err);
  })
  call.on('stream' , userStream=>{
    addVideo(vid , userStream);
  })
  call.on('close' , ()=>{
    vid.remove();
    console.log("user disconect")
  })
  peerConnections[id] = call;
})
socket.on('userDisconnect' , id=>{
  if(peerConnections[id]){
    peerConnections[id].close();
  }
})
function addVideo(video , stream){
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video);
}
