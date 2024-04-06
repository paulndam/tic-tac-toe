import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import db from "./src/models/index.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { postPlayer,getAllPlayers,getPlayer, getPlayerInfo } from "./src/controllers/playerController.js";
import { postGame,joinGameHandler,makeMoveHandler, listAllGames, gameState, getGameInfo } from "./src/controllers/gameController.js";

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

export const sessions = new Map();

export const generateSessionID = () => {
  // Simple generation logic; consider using a more robust method in production
  return `sess_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateSession = (sessionID) => {
  return sessions.has(sessionID);
};


io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  socket.on("createPlayer", async (data) => {

    console.log("===== server file data when creating player ========",data)
    const sessionID = generateSessionID()
    const player = await postPlayer(data,socket,sessionID)
    console.log("==== player in server file ======>",player)
    sessions.set(sessionID,{playerId:player.playerId,gameId:null})

  })

  socket.on("getAllPlayers", async (data) => {
    await getAllPlayers(socket)
  })

  socket.on("getPlayer", async (data) => {
    await getPlayer(data.playerId,socket)
  })

  // Handling the creation of a game
  socket.on('createGame', async (data) => {
    console.log("data in server file when creating game ========>",data)

    const sessionGameId = generateSessionID()

    // set up initial game state
    sessions.set(sessionGameId, {
      players: [socket.id],
      state: 'waiting for player',
    });

    const game = await postGame(data,socket,sessionGameId)
    console.log("game ===>",game)

    socket.join(sessionGameId);

    socket.emit("gameResponse", { 
      type: "gameCreated", 
      gameId: sessionGameId, // Using sessionGameId as gameId for simplicity
      message: "Game created successfully. Waiting for a player to join.",
    });


      
  });

  socket.on("getAllGames", async(data) => {
    await listAllGames(socket)
  })

  // Handling a player joining a game
  socket.on('joinGame', async (data) => {
    console.log("data in server file when joining game ========>", data);
    await joinGameHandler(data, socket, io);
  });
  

  // game state
  socket.on("requestGameState", async ({ gameId,sessionID }) => {
    console.log("====== calling request game state in server entry file =========",gameId, sessionID)
    await gameState({gameId,sessionID}, socket); 
  });

  // reset game
  socket.on("resetGame", async (data) => {
    await resetGame(data, socket);
  });

  // Handling a player making a move
  socket.on('makeMove', async (data) => {
    makeMoveHandler(data, socket,io);
  });

  socket.on("validateSession", async ({ sessionID }, callback) => {
    console.log("==== session received from client =========",sessionID)
    try {
      if (!sessionID || !validateSession(sessionID)) {
        return callback({ valid: false });
      }
  
      const sessionData = sessions.get(sessionID);
      if (!sessionData) return callback({ valid: false });
  
      const { playerId, gameId } = sessionData;
      const player = await getPlayerInfo(playerId);
      const game = await getGameInfo(gameId);
  
      if (!player || !game) {
        return callback({ valid: false });
      }
  
      callback({
        valid: true,
        playerId: player.id,
        playerName: player.name,
        gameId: game.id,
        board: game.board, 
        isPlayerOne: player.id === game.playerOneId,
        gameStarted: game.started,
        
      });
    } catch (error) {
      console.error("Error validating session:", error);
      callback({ valid: false, error: "An error occurred during session validation." });
    }
  });
  

  socket.on("endSession", ({ sessionID }) => {
    sessions.delete(sessionID); // Remove session data
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
