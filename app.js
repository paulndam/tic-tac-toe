import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import db from "./server/src/models/index.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import {
  postPlayer,
  getAllPlayers,
  getPlayer,
  getPlayerInfo,
} from "./server/src/controllers/playerController.js";
import {
  postGame,
  joinGameHandler,
  makeMoveHandler,
  listAllGames,
  gameState,
  getGameInfo,
  listAllWinRecords,
  restartGame,
} from "./server/src/controllers/gameController.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// creates express app.
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
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
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["*"],
    credentials: true,
  },
});

const server = httpServer.listen(PORT, () => {
  console.log(`Server up (📡 📡 📡) and running on Port: -----> ${PORT} `);
  console.log(
    `WebSocket Server is running 📡📡📡📡📡 on port -------> ${PORT}`
  );
});

export const sessions = new Map();

export const playerSocketMap = new Map();

export const generateSessionID = () => {
  // Simple generation logic; consider using a more robust method in production
  return `sess_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateSession = (sessionID) => {
  return sessions.has(sessionID);
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);
  socket.on("createPlayer", async (data) => {
    const sessionID = generateSessionID();
    const player = await postPlayer(data, socket, sessionID);

    sessions.set(sessionID, {
      playerId: player.playerId,
      socketId: socket.id,
      gameId: null,
    });

    playerSocketMap.set(player.playerId, socket.id);
  });

  socket.on("getAllPlayers", async (data) => {
    await getAllPlayers(socket);
  });

  socket.on("getPlayer", async (data) => {
    await getPlayer(data.playerId, socket);
  });

  // Handling the creation of a game
  socket.on("createGame", async (data) => {
    const sessionGameId = generateSessionID();

    // set up initial game state
    sessions.set(sessionGameId, {
      players: [socket.id],
      state: "waiting for player",
    });

    const game = await postGame(data, socket, sessionGameId);

    const gameId = game.dataValues.gameId;

    socket.join(gameId);

    socket.emit("gameResponse", {
      type: "gameCreated",
      gameId: gameId,
      message: "Game created successfully. Waiting for a player to join.",
    });
  });

  // reset game
  socket.on("restartGame", async (data) => {
    await restartGame(data, socket, io);
  });

  socket.on("getAllGames", async (data) => {
    await listAllGames(socket);
  });

  // Handling a player joining a game
  socket.on("joinGame", async (data) => {
    await joinGameHandler(data, socket, io);
  });

  // game state
  socket.on("requestGameState", async ({ gameId, sessionID }) => {
    await gameState({ gameId, sessionID }, socket);
  });

  socket.on("winningRecords", async (data) => {
    await listAllWinRecords(data, socket, io);
  });

  // Handling a player making a move
  socket.on("makeMove", async (data) => {
    makeMoveHandler(data, socket, io);
  });

  socket.on("validateSession", async ({ sessionID }, callback) => {
    try {
      if (!sessionID || !validateSession(sessionID)) {
        return callback({ valid: false });
      }

      const sessionData = sessions.get(sessionID);
      if (!sessionData || !sessionData.playerId)
        return callback({ valid: false });

      const { playerId, gameId } = sessionData;
      const player = await getPlayerInfo(playerId);
      if (!player) {
        return callback({ valid: false });
      }

      // Game validation is only attempted if a gameId exists in the session.
      let gameResponse = {};
      if (gameId) {
        const game = await getGameInfo(gameId);
        if (!game) {
          console.log(`Game ${gameId} not found for session ${sessionID}.`);
        } else {
          gameResponse = {
            gameId: game.id,
            board: game.board,
            isPlayerOne: player.id === game.playerOneId,
            gameStarted: game.started,
          };
        }
      }

      callback({
        valid: true,
        playerId: player.id,
        playerName: player.name,
        ...gameResponse,
      });
    } catch (error) {
      console.error("Error validating session:", error);
      callback({
        valid: false,
        error: "An error occurred during session validation.",
      });
    }
  });

  socket.on("endSession", ({ sessionID }) => {
    sessions.delete(sessionID);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
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
