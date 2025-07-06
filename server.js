const express = require("express");
const app = express();
const path = require("path");
const http = require("http").createServer(app);
const hbs = require("hbs");
let session = require("express-session");
const { set } = require("express/lib/application");
var requests = require("requests")
const { v4: uuidv4 } = require("uuid")
const { ExpressPeerServer } = require("peer")
const async = require("hbs/lib/async");
const peer = ExpressPeerServer(http, {
  debug: true,
});

const io = require("socket.io")(http);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const port = process.env.PORT || 80;

const static_path = path.join(__dirname, "./public");
app.use(express.static(static_path));

const template_path = path.join(__dirname, "./templates/views");
app.set("views", template_path);

const partials_path = path.join(__dirname, "./templates/partials");
hbs.registerPartials(partials_path);

app.set("view engine", "hbs")

app.use(express.static("./templates/views/images"));

http.listen(port, () => {
  console.log("connect to port " + port);
});

const users = {};
let roomName;

let rooms = { };
let countActUsers = [];
let countActUsersAndRooms = { countActUsers, rooms };
var found

var dataOfRoomAndUserCount = [];

app.get("/", async (req, res) => {
  let maP = new Map(io.sockets.adapter.rooms);
  let numOfScktObj;

  for (let index = 0; index < Object.keys(rooms).length; index++) {
    numOfScktObj = maP.get(Object.keys(rooms)[index]);

    if (numOfScktObj != null) {
      numOfScktArr = Array.from(numOfScktObj);
      countActUsers[index] = numOfScktArr.length;
    } else {
      countActUsers[index] = 0
    }
  }

  for (let count = 0; count < Object.keys(rooms).length; count++) {
    dataOfRoomAndUserCount[count] = await {
      nameOfTheRooms: Object.keys(rooms)[count],
      countOfTheActiveUsers: countActUsers[count],
      sortable: true,
      resizeable: true,
    };
  }

  res.render("present", { dataOfRoomAndUserCount: dataOfRoomAndUserCount });
});

app.post("/api", async (req, res) => {
  res.json(dataOfRoomAndUserCount);
})
app.get("/:room", async (req, res) => {
  let names = await Object.keys(rooms).includes(`${req.params.room}`);

  if (names) {
    roomName = req.params.room;

    res.render("room", { roomName: req.params.room });
  } else {
    res.redirect("/");
  }
});
app.post("/room", async (req, res) => {
  if (rooms[req.body.room] != null) {
    var roomWithNum = req.body.room + Math.floor(Math.random() * 10000 + 1);
    rooms[roomWithNum] = { users: {} };
    io.emit("room-created", roomWithNum);
    res.redirect(roomWithNum);
  } else {
    rooms[req.body.room] = { users: {} };

    io.emit("room-created", req.body.room);

    res.redirect(req.body.room);
  }
});

app.get("*", async (req, res) => {
  res.redirect("/");
});

let ID;

io.on("connection", (socket) => {
  console.log("connected....");

  socket.on("message", (msg) => {
    console.log("msg  section");
    console.log(msg.url);

    socket.broadcast.to(msg.url).emit("message", msg);
  });

  socket.on("newUserJoin", (Name, ws) => {
    socket.on("newUser", (id, room) => {
      socket.join(room);

      socket.broadcast.to(ws).emit("userJoined", id);
      socket.on("disconnect", () => {
        socket.broadcast.to(ws).emit("userDisconnect", id);
      });
    });

    socket.join(ws);

    users[socket.id] = Name;

    socket.broadcast.to(ws).emit("UserJoin", Name);

    socket.on("disconnect", () => {
      socket.broadcast.to(ws).emit("leftchatroom", users[socket.id]);

      socket.leave(ws);
      delete users[socket.id]
    });
  });
});
