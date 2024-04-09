import { playerSocketMap, sessions, validateSession } from "../../../app.js";
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

export const restartGame = async (data, socket, io) => {
  try {
    const { gameId } = data;

    const oldGame = await db.games.findByPk(gameId);

    if (!oldGame) {
      socket.emit("gameResponse", {
        type: "error",
        message: "Game not found.",
      });
      return;
    }

    const newGame = await db.games.create({
      playerOneId: oldGame.playerOneId,
      playerTwoId: oldGame.playerTwoId,
      status: GameStatus.In_Progress,
      board: JSON.stringify(Array(9).fill(null)),
    });

      [(oldGame.playerOneId, oldGame.playerTwoId)].forEach((playerId) => {
        if (playerSocketMap.has(playerId)) {
          const socketId = playerSocketMap.get(playerId);
          if (socketId) {
            io.to(socketId).emit("gameRestarted", {
              type: "gameRestarted",
              newGameId: newGame.gameId,
              isPlayerOne: playerId === newGame.playerOneId,
              message: "A new game has started. Good luck! 🤠 🤠 🤠",
            });
          }
        } else {
          console.log(`No socket ID found for Player ID ${playerId}`);
        }
      });

    sessions.forEach((session, sessionId) => {
      if (
        [oldGame.playerOneId, oldGame.playerTwoId].includes(session.playerId)
      ) {
        sessions.set(sessionId, { ...session, gameId: newGame.gameId });
      }
    });
  } catch (error) {
    console.error("Failed to restart the game:", error);
    socket.emit("gameResponse", {
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

    const gameStatus = await makeMove(gameId, playerId, position);

    if (gameStatus.dataValues.status === 'finished') {
      let message = "It's a draw!"; 

      if (gameStatus.dataValues.winner) {
        const gameWinnerName = await db.players.findByPk(gameStatus.dataValues.winner);
        message = `${gameWinnerName.dataValues.name} wins!`;
      }

      io.to(gameId).emit("gameOver", {
        type: "gameOver",
        status: gameStatus.dataValues.status,
        message: message,
        board: gameStatus.dataValues.board,
      });
    } else {
      io.to(gameId).emit("gameMoveResponse", {
        type: "moveMade",
        gameStatus: gameStatus.dataValues,
      });
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
    const finishedGames = await db.games.findAll({
      where: { status: "finished", winner: { [db.Sequelize.Op.ne]: null } },
      include: [
        { model: db.players, as: "PlayerOne", attributes: ["name"] },
        { model: db.players, as: "PlayerTwo", attributes: ["name"] },
      ],
    });

    let winCounts = {};

    finishedGames.forEach((game) => {
      const winnerName =
        game.winner === game.playerOneId
          ? game.PlayerOne.name
          : game.PlayerTwo.name;

      if (!winCounts[winnerName]) {
        winCounts[winnerName] = 0;
      }

      winCounts[winnerName]++;
    });

    const records = Object.keys(winCounts)
      .map((playerName) => ({
        playerName,
        wins: winCounts[playerName],
      }))
      .sort((a, b) => b.wins - a.wins);

    io.emit("winningRecordsResponse", { type: "winRecords", records });
  } catch (error) {
    console.error("Error fetching win records:", error);
    socket.emit("error", { message: "Failed to fetch win records." });
  }
};
