import db from "../models/index.js";
import { allPlayers, createPlayer, playerById } from "../services/player.js";

export const postPlayer = async (data, socket,sessionID) => {
  try {
    console.log("======= data from post player controller ===========>",data)
    const { name, gameId } = data;

    if (!name) {
      socket.emit("playerResponse", {
        type: "error",
        message: "Player name is required",
      });
      return;
    }

    let player;

    player = await db.players.findOne({where:{name:name}});
    console.log("======= player in post player controller ===========>",player)


    if (!player || player === null) {
      player = await createPlayer({name});
    }

    if (gameId) {
      const game = await db.games.findOne({ where: { gameId } });

      if (!game) {
        socket.emit("playerResponse", {
          type: "error",
          message: "Game not found",
        });
        return;
      }

      if (game.playerTwoId) {
        socket.emit("playerResponse", {
          type: "error",
          message: "Game is already full",
        });
        return;
      }

      game.playerTwoId = player.playerId;
      await game.save();

      socket.join(gameId); // Join the socket.io room for the game

      // Notify the other player in the game that a new player has joined
      socket.to(gameId).emit("gameJoinedResponse", {
        type: "gameJoined",
        gameId: gameId,
        playerTwo: player,
        sessionID
      });

      // Confirm to the joining player that they've been added
      socket.emit("playerResponse", {
        type: "joinedGame",
        game,
        playerTwo: player,
        sessionID
      });
    } else {
      console.log("=== confirming player is created and emitting response back to client ========")
      console.log(player)
      socket.emit("playerResponse", { type: "playerCreated", player,sessionID });
    }
    return player;
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
      return null; // or handle as you see fit
    }
    return player; // Adjust this as needed based on your data model
  } catch (error) {
    console.error("Error fetching player:", error);
    throw new Error("Error fetching player");
  }
};
