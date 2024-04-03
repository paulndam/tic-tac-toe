import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import db from "./src/models/index.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { postPlayer,getAllPlayers,getPlayer } from "./src/controllers/playerController.js";
import { postGame,joinGameHandler,makeMoveHandler, listAllGames } from "./src/controllers/gameController.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// creates express app.
app.use(cors({origin:'http://localhost:3000',credentials:true}))
app.options("*", cors());

app.use(express.json());
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
app.use(cookieParser());

// routes section below.
// app.use("/api",playerRoute)
// app.use("/api",gameRoute)

// DB Connection
db.sequelize
  .authenticate()
  .then(() => {
    console.log(
      `Connection to the database has been established successfully.`
    );
  })
  .catch((error) => {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to connect to the database";
    console.log(`ERROR: ${errorMessage}`);
  });


const httpServer = createServer(app);
const io = new Server(httpServer,{
  cors:{
    origin:"http://localhost:3000",
    methods: ["*"],
    credentials:true
  }
});

const server = httpServer.listen(PORT, () => {
  console.log(`Server up (📡 📡 📡) and running on Port: -----> ${PORT} `);
  console.log(
    `WebSocket Server is running 📡📡📡📡📡 on port -------> ${PORT}`
  );
});


io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  socket.on("createPlayer", async (data) => {
    await postPlayer(data,socket)
  })

  socket.on("getAllPlayers", async (data) => {
    await getAllPlayers(socket)
  })

  socket.on("getPlayer", async (data) => {
    await getPlayer(data.playerId,socket)
  })

  // Handling the creation of a game
  socket.on('createGame', async (data) => {
      postGame(data,socket)
  });

  socket.on("getAllGames", async(data) => {
    await listAllGames(socket)
  })

  // Handling a player joining a game
  socket.on('joinGame', async (data) => {
    joinGameHandler(data, socket,io);
  });

  // Handling a player making a move
  socket.on('makeMove', async (data) => {
    makeMoveHandler(data, socket,io);
  });

  // Add more event handlers as needed

  socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
  });
});


process.on("unhandledRejection", (error) => {
  const errorMessage =
    error instanceof Error ? error.message : "Unhandled Rejection";
  console.log(`Unhandled Rejection, shutting down server.${errorMessage}`);
  server.close(() => {
    process.exit(1);
  });
});
