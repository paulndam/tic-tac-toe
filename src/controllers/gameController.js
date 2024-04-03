import { allGames, createGame, joinGame, makeMove } from "../services/game.js";

export const postGame = async (data, socket) => {
  try {
    const { playerId } = data;

    if (!playerId) {
      socket.emit("gameResponse", {
        type: "error",
        message: "Player ID is required to create a game.",
      });
      return;
    }

    const newGame = await createGame(playerId);

    socket.join(newGame.gameId);

    socket.emit("gameResponse", { type: "gameCreated", newGame });

    // broadcast event to all players about new game created.
    socket.broadcast.emit("gameResponse", {
      type: "newGameAvailable",
      newGame,
    });
  } catch (error) {
    socket.emit("gameResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
    });
  }
};

export const listAllGames = async (socket) => {
  try {
    const games = await allGames();

    socket.emit("gameResponse", { type: "allGames", games });
  } catch (error) {
    socket.emit("gameResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
    });
  }
};

export const joinGameHandler = async (data, socket, io) => {
  try {
    const { playerId, gameId } = data;

    if (!playerId || !gameId) {
      socket.emit("gameResponse", {
        type: "error",
        message: "Both Player ID and Game ID are required",
      });
      return;
    }

    const updateGame = await joinGame(gameId, playerId);

    socket.join(updateGame.gameId);

    io.to(gameId).emit("gameResponse", {
      type: "gameJoined",
      updateGame,
    });
  } catch (error) {
    socket.emit("gameResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
    });
  }
};

export const makeMoveHandler = async (data, socket, io) => {
  try {
    const { playerId, position, gameId } = data;

    if (typeof position !== "number") {
      socket.emit("gameMoveResponse", {
        type: "error",
        message: "Position must be a number.",
      });
      return;
    }

    if (!playerId || position === undefined) {
      socket.emit("gameMoveResponse", {
        type: "error",
        message: "Player ID and position are required.",
      });
      return;
    }

    const gameStatus = await makeMove(gameId, playerId, position);

    io.to(gameId).emit("gameMoveResponse", { type: "moveMade", gameStatus });
  } catch (error) {
    socket.emit("gameMoveResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
    });
  }
};
