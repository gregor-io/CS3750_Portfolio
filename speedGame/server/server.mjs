// package imports
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import db from "./db/conn.mjs";
import { v4 } from "uuid";

// local files
import "./loadEnvironment.mjs";
import records from "./routes/record.mjs";

const PORT = process.env.PORT || 5050;
const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

const rooms = [];
const userRooms = {};
const occupiedRooms = {};

const classicGameStates = [];

let testJSON = {
  p1hand: ["CA", "C2"],
  p2hand: ["C3", "C4"],
  p1score: 0,
  p2score: 0,
  p1turn: true,
  p2turn: false,
  p1deck: ["S6", "S7"],
  p2deck: ["S8", "S9"],
};

// TODO:
// Create a test JSON object
// Create a socket connection
// Create a socket event listener
// Send the test JSON object to the client

app.use(cors());
app.use(express.json());

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   socket.emit("test", testJSON);
//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
// });

app.use("/record", records);
app.use("/create-user", async (req, res) => {
  let newDocument = {
    username: req.body.userName,
    salt: req.body.saltScore,
    password: req.body.password,
    email: req.body.email,
  };
  let collection = await db.collection("Users");
  let result = await collection.insertOne(newDocument);
  res.send(result).status(204);
});

app.use("/login-user", async (req, res) => {
  let collection = await db.collection("Users");
  let query = { username: req.body.username };
  let result = await collection.findOne(query);

  if (!result) res.send({ saltScore: null }).status(404);
  else {
    let salt = result.salt;
    res.send({ saltScore: salt }).status(200);
  }
});

app.use("/login-password", async (req, res) => {
  let collection = await db.collection("Users");
  let query = { username: req.body.userName };
  let result = await collection.findOne(query);

  if (!result) res.send({ signedIn: false }).status(404);
  else if (req.body.password === result.password)
    res.send({ signedIn: true }).status(200);
  else res.send({ signedIn: false }).status(404);
});

app.use("/classic-speed/:roomID", (req, res) => {
  const roomID = req.params.roomID;
  let cardDeck = generateDeck();
  shuffleDeck(cardDeck);
  shuffleDeck(cardDeck);
  let playPileLeft = [];
  let playPileRight = [];
  let player1Hand = [];
  let player2Hand = [];
  let player1Deck = [];
  let player2Deck = [];
  let leftPlayDeck = [];
  let rightPlayDeck = [];

  for (let i = 0; i < 5; i++) {
    drawCard(cardDeck, player1Hand);
    drawCard(cardDeck, player2Hand);
  }

  drawCard(cardDeck, playPileLeft);
  drawCard(cardDeck, playPileRight);

  for (let i = 0; i < 15; i++) {
    drawCard(cardDeck, player1Deck);
    drawCard(cardDeck, player2Deck);
  }

  for (let i = 0; i < 5; i++) {
    drawCard(cardDeck, leftPlayDeck);
    drawCard(cardDeck, rightPlayDeck);
  }

  console.log(player1Hand);
});

//Using to build a demo card management system
app.use("/cardDemo", (req, res) => {
  let result = "Hello World";

  let playerHand = new Array();
  let player2Hand = new Array();
  console.log(cardDeck);
  shuffleDeck(cardDeck);
  shuffleDeck(cardDeck);
  shuffleDeck(cardDeck);
  shuffleDeck(cardDeck);
  shuffleDeck(cardDeck);
  shuffleDeck(cardDeck);
  shuffleDeck(cardDeck);
  shuffleDeck(cardDeck);
  console.log(cardDeck);

  for (let i = 0; i < 7; i++) {
    drawCard(cardDeck, playerHand);
    drawCard(cardDeck, player2Hand);
  }

  console.log(cardDeck);
  console.log(playerHand);
  console.log(player2Hand);

  res.send(result).status(204);
});

function shuffleDeck(deckArray) {
  for (let i = deckArray.length - 1; i > 0; i--) {
    let randomIndex = Math.floor(Math.random() * (i + 1));
    let temp = deckArray[i];
    deckArray[i] = deckArray[randomIndex];
    deckArray[randomIndex] = temp;
  }
}

function drawCard(from, to) {
  to.unshift(from.shift());
}

function generateDeck() {
  let cardDeck = [
    "CA",
    "C2",
    "C3",
    "C4",
    "C5",
    "C6",
    "C7",
    "C8",
    "C9",
    "C10",
    "CJ",
    "CQ",
    "CK",
    "DA",
    "D2",
    "D3",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
    "D9",
    "D10",
    "DJ",
    "DQ",
    "DK",
    "HA",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "H7",
    "H8",
    "H9",
    "H10",
    "HJ",
    "HQ",
    "HK",
    "SA",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10",
    "SJ",
    "SQ",
    "SK",
  ];
  return cardDeck;
}

//socket.io
const emojis = [
  "🎮",
  "❓",
  "🃏",
  "😀",
  "😢",
  "💩",
  "🤡",
  "👋",
  "👍",
  "🌴",
  "✔️",
  "💀",
  "🤬",
  "🤯",
  "🧠",
  "🥳",
];
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected on server.mjs`);

  socket.on("getRooms", () => {
    console.log("getRooms on server.mjs");
    socket.emit("roomList", rooms);
  });

  socket.on("createRoom", () => {
    // generate a random room id
    const room = v4();
    socket.join(room);
    rooms.push(room);
    console.log("Room created on server.mjs:", room);
    socket.emit("roomCreated", room);
    socket.emit("roomList", rooms);
  });

  socket.on("joinRoom", (username, roomID) => {
    console.log(username + " joined " + roomID);
    userRooms[username] = roomID;
    if (!occupiedRooms[roomID]) {
      occupiedRooms[roomID] = [username];
    } else {
      occupiedRooms[roomID] = [...occupiedRooms[roomID], username];
    }
    if (occupiedRooms[roomID].length === 2) {
      io.emit("roomFull", roomID);
    }
    socket.join(roomID);
    socket.emit("roomJoined", roomID);
  });

  socket.on("userJoined", (username) => {
    console.log(username + " joined the server");
    socket.emit("joinedRoom", userRooms[username]);
  });

  socket.on("emitRoom", (room) => {
    console.log("emitRoom on server.mjs:", room);
    // socket.to(room).emit("roomEmitted", room);
    socket.emit("roomEmitted", room);
  });

  socket.on("sendMessage", (message) => {
    console.log(message + " from backend server.mjs");
    const id = message.id;
    //console.log(id + " i have received the id from the frontend user");

    //for the emoji preset
    if (emojis[id]) {
      const emoji = emojis[id];
      io.emit("message", { message: emoji });
    }

    //basic message
    else {
      io.emit("message", message);
    }
  });

  // game logic
  socket.on("gameStart", (room) => {
    console.log("gameStart on server.mjs:", room);
    // socket.to(room).emit("gameStarted", room);
    socket.emit("gameStarted", room);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected on server.mjs. Socket ID:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running at http://localhost:${PORT}`);
});

// start the Express server
// app.listen(PORT, () => {
//   console.log(`Server is running on port: ${PORT}`);
// });
