import { sessions, validateSession } from "../../app.js";
import { GameStatus } from "../models/game.js";
import db from "../models/index.js";
import {
  allGames,
  createGame,
  gameReset,
  joinGame,
  makeMove,
} from "../services/game.js";

export const postGame = async (data, socket, gameSessionId) => {
  try {
    const { playerId } = data;

    if (!playerId) {
      socket.emit("gameResponse", {
        type: "error",
        message: "Player ID is required to create a game.",
      });
      return;
    }

    const player = await db.players.findByPk(playerId);

    if (!player) {
      socket.emit({
        type: "error",
        message: "Player not found",
      });
    }

    const newPlayerId = player.dataValues.playerId;

    const newGame = await createGame(newPlayerId);

    if (!newGame) {
      // This branch might not be necessary if createGame throws an error for failures
      console.error("Failed to create a new game.");
      socket.emit("gameResponse", {
        type: "error",
        message: "Failed to create a new game.",
      });
      return;
    }

    socket.join(newGame.dataValues.gameId || gameSessionId);

    socket.emit("gameResponse", {
      type: "gameCreated",
      newGame,
      gameSessionId,
    });

    // broadcast event to all players about new game created.
    socket.broadcast.emit("gameResponse", {
      type: "newGameAvailable",
      newGame,
      gameSessionId,
    });
    return newGame;
  } catch (error) {
    socket.emit("gameResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
    });
  }
};

export const restartGame = async (data, socket,io) => {
  try {
    const { gameId } = data;

    // Fetch the old game to get player IDs
    const oldGame = await db.games.findByPk(gameId);
    if (!oldGame) {
      socket.emit("gameResponse", {
        type: "error",
        message: "Game not found.",
      });
      return;
    }

    // Create a new game with the same players
    const newGame = await db.games.create({
      playerOneId: oldGame.playerOneId,
      playerTwoId: oldGame.playerTwoId,
      status: GameStatus.In_Progress,
      board: JSON.stringify(Array(9).fill(null)),
    });

    // Notify the players about the new game
    io.to(oldGame.playerOneId).emit("gameRestarted", {
      newGameId: newGame.gameId,
    });
    if (oldGame.playerTwoId) {
      io.to(oldGame.playerTwoId).emit("gameRestarted", {
        newGameId: newGame.gameId,
      });
    }

    // Leave the old game room and join the new one
    socket.leave(gameId);
    socket.join(newGame.gameId);

    socket.emit("gameRestartedResponse", {
      type: "gameRestarted",
      message: "Game has been restarted.",
      newGameId: newGame.gameId,
    });
  } catch (error) {
    console.error("Failed to restart the game:", error);
    socket.emit("gameRestartedResponse", {
      type: "error",
      message: "Failed to restart the game.",
    });
  }
};

export const resetGame = async (data, socket) => {
  try {
    const { gameId } = data;

    if (!gameId) {
      socket.emit("gameResponse", {
        type: "error",
        message: "Game ID is required to reset the game.",
      });
      return;
    }

    await gameReset(gameId);

    // After resetting the game, emit an event to both players in the game room
    io.to(gameId).emit("gameResetResponse", { type: "gameReset" });
  } catch (error) {
    socket.emit("gameResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.message,
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

  const { sessionID, gameId } = data;

  if (!validateSession(sessionID)) {
    socket.emit("gameJoinedResponse", {
      type: "error",
      message: "Invalid session ID",
    });
    return;
  }

  const sessionData = sessions.get(sessionID);

  const playerId = sessionData.playerId;

  try {
    const updateGame = await joinGame(gameId, playerId);

    const playerTwo = await db.players.findByPk(playerId);

    if (!playerTwo) {
      throw new Error("Player not found");
    }

    socket.join(gameId);

    // Notify all clients in the game room about the new player joining
    io.to(gameId).emit("gameJoinedResponse", {
      type: "gameJoined",
      updateGame,
      playerTwo: {
        playerId: playerTwo.playerId,
        name: playerTwo.name,
      },
    });
  } catch (error) {
    socket.emit("gameJoinedResponse", {
      type: "error",
      message:
        error.message || "An error occurred while trying to join the game",
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

    const gameWinnerName = await db.players.findByPk(gameStatus.winner);

    if (gameStatus.status === GameStatus.Finished) {
      io.to(gameId).emit("gameOver", {
        type: "gameOver",
        status: gameStatus.status,
        winner: gameWinnerName.name || gameWinnerName.dataValues.name,
        message:
          gameWinnerName.name || gameWinnerName.dataValues.name
            ? `${gameWinnerName.name || gameWinnerName.dataValues.name} wins!`
            : "It's a draw!",
      });
    } else {
      io.to(gameId).emit("gameMoveResponse", { type: "moveMade", gameStatus });
    }

  } catch (error) {
    socket.emit("gameMoveResponse", {
      type: "error",
      message: error.message || "An unexpected error occurred.", 
    });
  }
};

export const gameState = async ({ gameId, sessionID }, socket) => {
  if (!validateSession(sessionID)) {
    socket.emit("gameStateResponse", {
      type: "error",
      message: "Invalid session ID",
    });
    return;
  }

  try {
    const game = await db.games.findByPk(gameId, {
      include: [
        { model: db.players, as: "PlayerOne" },
        { model: db.players, as: "PlayerTwo" },
      ],
    });

    if (!game || !game.dataValues.board) {
      socket.emit("gameStateResponse", {
        type: "error",
        message: "Game data is incomplete",
      });
      return;
    }

    const boardState = game.dataValues.board
      ? game.dataValues.board
      : JSON.stringify(Array(9).fill(null));

    socket.emit("gameStateResponse", {
      type: "gameState",
      board: boardState,
      gameId: game.dataValues.gameId,
      status: game.dataValues.status,
      playerOne: game.dataValues.PlayerOne,
      playerTwo: game.dataValues.PlayerTwo,
      currentTurn: game.dataValues.currentTurn,
      sessionID,
    });
  } catch (error) {
    socket.emit("gameStateResponse", {
      type: "error",
      message: "An error occurred while retrieving game state",
    });
  }
};

export const getGameInfo = async (gameId) => {
  try {
    const game = await db.games.findByPk(gameId, {
      include: [
        { model: db.players, as: "PlayerOne" },
        { model: db.players, as: "PlayerTwo" },
      ],
    });
    if (!game) {
      console.log("Game not found");
      return null;
    }
    return game;
  } catch (error) {
    console.error("Error fetching game:", error);
    throw new Error("Error fetching game");
  }
};

export const listAllWinRecords = async (_, socket, io) => {
  try {
    const winRecords = await db.games.findAll({
      where: {
        status: db.Sequelize.literal(
          '"Game"."status" = \'finished\' AND "Game"."winner" IS NOT NULL'
        ),
      },
      attributes: [
        [db.Sequelize.col("PlayerOne.name"), "playerName"],
        [db.Sequelize.fn("COUNT", db.Sequelize.col("Game.winner")), "wins"],
      ],
      include: [
        {
          model: db.players,
          as: "PlayerOne",
          attributes: [],
        },
      ],
      group: ["PlayerOne.name"],
      order: [[db.Sequelize.literal('"wins"'), "DESC"]],
    });

    const records = winRecords.map((record) => ({
      playerName: record.get("playerName"),
      wins: record.get("wins"),
    }));

    io.emit("winningRecordsResponse", { type: "winRecords", records });
  } catch (error) {
    console.error("Error fetching win records:", error);
    socket.emit("error", { message: "Failed to fetch win records." });
  }
};
