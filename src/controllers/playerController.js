import db from "../models/index.js";
import { allPlayers, createPlayer, playerById } from "../services/player.js";
import { AppError } from "../util/errorHandler.js";

export const postPlayer = async (data, socket, sessionID) => {
  try {
    const { name, gameId } = data;

    if (!name) {
      socket.emit("playerResponse", {
        type: "error",
        message: "Player name is required",
      });
      return;
    }

    const existingPlayer = await db.players.findOne({ where: { name: name } });

    if (existingPlayer) {
      throw new AppError(400,"Username already exist")
    }

    const newPlayer = await createPlayer({ name });

    if (gameId) {
      const game = await db.games.findOne({ where: { gameId } });

      if (!game) {
        socket.emit("playerResponse", {
          type: "error",
          message: "Game not found",
        });
        return;
      }

      if (game.dataValues.playerTwoId) {
        socket.emit("playerResponse", {
          type: "error",
          message: "Game is already full",
        });
        return;
      }

      game.dataValues.playerTwoId = newPlayer.dataValues.playerId;
      await game.save();

      socket.join(gameId); 

      socket.to(gameId).emit("gameJoinedResponse", {
        type: "gameJoined",
        gameId: gameId,
        playerTwo: newPlayer,
        sessionID,
      });

      socket.emit("playerResponse", {
        type: "joinedGame",
        game,
        playerTwo: newPlayer,
        sessionID,
      });
    } else {
      console.log(newPlayer);
      socket.emit("playerResponse", {
        type: "playerCreated",
        newPlayer,
        sessionID,
      });
    }
    return newPlayer;
  } catch (error) {
    socket.emit("playerResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
    });
  }
};

export const getAllPlayers = async (socket) => {
  try {
    const players = await allPlayers();

    socket.emit("playerResponse", { type: "allPlayers", players });
  } catch (error) {
    socket.emit("playerResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
    });
  }
};

export const getPlayer = async (data, socket) => {
  try {
    const { playerId } = data;

    if (!playerId) {
      socket.emit("playerResponse", {
        type: "error",
        message: "Player ID required",
      });
      return;
    }

    const player = await playerById(playerId);

    socket.emit("playerResponse", {
      type: "singlePlayer",
      player,
    });
  } catch (error) {
    socket.emit("playerResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
    });
  }
};

export const getPlayerInfo = async (playerId) => {
  try {
    const player = await db.players.findByPk(playerId);
    if (!player) {
      console.log("Player not found");
      return null; 
    }
    return player; 
  } catch (error) {
    console.error("Error fetching player:", error);
    throw new Error("Error fetching player");
  }
};
