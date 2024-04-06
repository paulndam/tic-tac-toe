import { sessions, validateSession } from "../../app.js";
import db from "../models/index.js";
import { allGames, createGame, gameReset, joinGame, makeMove } from "../services/game.js";

export const postGame = async (data, socket,gameSessionId) => {
  try {
    console.log("====== data in post game controller =========",data)
    const { playerId } = data;

    if (!playerId) {
      socket.emit("gameResponse", {
        type: "error",
        message: "Player ID is required to create a game.",
      });
      return;
    }

    const player = await db.players.findByPk(playerId)
    console.log("found player =========>",player)

    if(!player){
      socket.emit({
        type:"error",
        message: "Player not found",
      })
    }

    const newPlayerId = player.dataValues.playerId


    const newGame = await createGame(newPlayerId);
    console.log("new game =======>",newGame)

    if (!newGame) {
      // This branch might not be necessary if createGame throws an error for failures
      console.error("Failed to create a new game.");
      socket.emit("gameResponse", {
        type: "error",
        message: "Failed to create a new game.",
      });
      return;
    }

    socket.join(newGame.gameId || gameSessionId);

    socket.emit("gameResponse", { 
      type: "gameCreated", 
      newGame,
      gameSessionId
     });

    // broadcast event to all players about new game created.
    socket.broadcast.emit("gameResponse", {
      type: "newGameAvailable",
      newGame,
      gameSessionId
    });
  } catch (error) {
    socket.emit("gameResponse", {
      type: "error",
      statusCode: error.statusCode,
      message: error.statusMessage,
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

    await gameReset(gameId)

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

// export const joinGameHandler = async (data, socket, io) => {
//   try {
//     const { playerId, gameId } = data;

//     if (!playerId || !gameId) {
//       socket.emit("gameJoinedResponse", {
//         type: "error",
//         message: "Both Player ID and Game ID are required",
//       });
//       return;
//     }

//     const updateGame = await joinGame(gameId, playerId);

//     // Fetch playerTwo details
//     const playerTwo = await db.players.findByPk(playerId);
//     if (!playerTwo) {
//       throw new Error("Player not found");
//     }

//     socket.join(updateGame.gameId);

//     io.to(gameId).emit("gameJoinedResponse", {
//       type: "gameJoined",
//       updateGame,
//       playerTwo: {
//         id: playerTwo.playerId,
//         name: playerTwo.name, 
//       },
//     });
//   } catch (error) {
//     socket.emit("gameJoinedResponse", {
//       type: "error",
//       statusCode: error.statusCode,
//       message: error.statusMessage,
//     });
//   }
// };

export const joinGameHandler = async (data, socket, io) => {
  console.log("data when joining game ======>", data);
  console.log("socket when joining game ======>", socket.id);

  const { sessionID, gameId } = data;

  if (!validateSession(sessionID)) {
    socket.emit("gameJoinedResponse", {
      type: "error",
      message: "Invalid session ID",
    });
    return;
  }

  const sessionData = sessions.get(sessionID);
  console.log("sessionData ======>",sessionData)

  const playerId = sessionData.playerId;
  console.log("playerId ======>",playerId)


  try {
    const updateGame = await joinGame(gameId, playerId);
    console.log("==== updateGame ====",updateGame)

    const playerTwo = await db.players.findByPk(playerId);
    console.log("==== playerTwo ====",playerTwo)


    if (!playerTwo) {
      throw new Error("Player not found");
    }

    socket.join(gameId);

    // Notify all clients in the game room about the new player joining
    io.to(gameId).emit("gameJoinedResponse", {
      type: "gameJoined",
      updateGame,
      playerTwo: {
        id: playerTwo.playerId,
        name: playerTwo.name,
      },
    });
  } catch (error) {
    socket.emit("gameJoinedResponse", {
      type: "error",
      message: error.message || "An error occurred while trying to join the game",
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

// export const gameState = async (gameId, socket) => {
//   try {
//     const game = await db.games.findByPk(gameId, {
//       include: [{ model: db.players, as: 'PlayerOne' }, { model: db.players, as: 'PlayerTwo' }]
//     });

//     if (!game) {
//       socket.emit('gameStateResponse', { type: 'error', message: 'Game not found' });
//       return;
//     }

//     socket.emit('gameStateResponse', {
//       type: 'gameState',
//       status: game.status,
//       playerOne: game.playerOneId,
//       playerTwo: game.playerTwoId,
//       currentTurn: game.currentTurn,
//     });
//   } catch (error) {
//     socket.emit("gameStateResponse", {
//       type: "error",
//       message: "An error occurred while retrieving game state",
//     });
//   }
// };


export const gameState = async ({ gameId, sessionID }, socket) => {
  console.log("===== game state controller method ======>",gameId,sessionID)
  if (!validateSession(sessionID)) {
    socket.emit('gameStateResponse', { type: 'error', message: 'Invalid session ID' });
    return;
  }



  try {
    const game = await db.games.findByPk(gameId, {
      include: [{ model: db.players, as: 'PlayerOne' }, { model: db.players, as: 'PlayerTwo' }]
    });

    if (!game) {
      socket.emit('gameStateResponse', { type: 'error', message: 'Game not found' });
      return;
    }

    console.log("===== game in game state controller method ====>",game)


    socket.emit('gameStateResponse', {
      type: 'gameState',
      status: game.status,
      playerOne: game.PlayerOne, 
      playerTwo: game.PlayerTwo, 
      currentTurn: game.currentTurn,
      sessionID
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
      include: [{ model: db.players, as: 'PlayerOne' }, { model: db.players, as: 'PlayerTwo' }]
    });
    if (!game) {
      console.log("Game not found");
      return null; // or handle as you see fit
    }
    return game; // You might adjust the returned object based on your needs
  } catch (error) {
    console.error("Error fetching game:", error);
    throw new Error("Error fetching game");
  }
};
