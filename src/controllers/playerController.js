import { allPlayers, createPlayer, playerById } from "../services/player.js";

export const postPlayer = async (data, socket) => {
  try {
    const { name } = data;

    if (!name) {
      socket.emit("playerResponse", {
        type: "error",
        message: "Player name is required",
      });
      return;
    }

    const newPlayer = await createPlayer({ name });

    socket.emit("playerResponse", { type: "playerCreated", newPlayer });
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
