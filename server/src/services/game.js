import db from "../models/index.js";
import { GameStatus } from "../models/game.js";
import { AppError } from "../util/errorHandler.js";
import { checkWinCondition } from "../util/gameCondition.js";

export const createGame = async (playerId) => {
  try {
    console.log("player ID in create game service method =====>",playerId)
    // check if playerId exist in DB
    const idExist = await db.players.findOne({
        where:{playerId:playerId}
    })

    if(!idExist){
        throw new AppError(404,` User with that ID not found in our records`)
    }

    const newGame = await db.games.create({
        playerOneId:playerId,
        status:GameStatus.In_Progress,
        currentTurn: playerId
    })
    console.log("new game created in service method =====>",newGame)
    return newGame
  } catch (error) {
    throw new AppError(400, `${error.message}`);
  }
};

export const gameReset = async (gameId) => {
  try {
    const game = await db.games.findOne({
      where: { gameId: gameId },
    });

    if (!game) {
      throw new Error(`Game with ID ${gameId} not found.`);
    }

    await game.update({
      board: Array(9).fill(null), 
      currentTurn: game.playerOneId, 
      status: GameStatus.Pending,
    });
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}


export const allGames = async () => {
  try{

    return await db.games.findAll({})

  }catch (error) {
    throw new AppError(400, `${error.message}`);
  }
}

export const joinGame = async (gameId,playerId) => {
  try{
    const game = await db.games.findByPk(gameId)

    if(!game){
      throw new AppError(404,"Game not found")
    }

    // ensure game is not finished.
    if(game.status === GameStatus.Finished){
      throw new AppError(400,"Cannot join finished game")
    }

    // ensures game is not already full
    if(game.playerTwoId){
      throw new AppError(400,"Game already full")

    }

    // ensure players that created the game can't join their own game
    if(game.playerOneId === playerId){
      throw new AppError(400, "Cannot join your own game")
    }

    game.playerTwoId = playerId;

    game.status = GameStatus.In_Progress;

    await game.save();

    return game
  }catch (error) {
    throw new AppError(400, `${error.message}`);
  }
}


// export const makeMove = async(gameId,playerId,position) => {
//   try{

//     const game = await db.games.findByPk(gameId);

//     if(!game){
//       throw new AppError(404,'Game not found');
//     }

//     if(game.dataValues.status !== GameStatus.In_Progress){
//       throw new AppError(400,"Game is currently not in progress")
//     }

//     if(game.dataValues.currentTurn !== playerId){
//       throw new AppError(400,"It's not your turn yet.")
//     }

//     if(position < 0 || position > 8){
//       throw new AppError(400, "Invalid move position")
//     }

//     // converting board string back to array for manipulation.
//     let board = JSON.parse(game.dataValues.board);

//     if(board[position] !== null) throw new AppError(400,"Position already taken")

//     // updating board.
//     board[position] = game.dataValues.currentTurn === game.dataValues.playerOneId ? 'X' : 'O';

//     // checking win or draw conditions.
//     const result = checkWinCondition(board);

//     if(result === 'X' || result === 'O'){
//       game.dataValues.status = GameStatus.Finished;
//       game.dataValues.winner = playerId;
//     }else if (result === 'Draw'){
//       game.dataValues.status = GameStatus.Finished
//     }else{
//       // switching turn for other players;
//       game.dataValues.currentTurn = game.dataValues.currentTurn === game.dataValues.playerOneId ? game.dataValues.playerTwoId : game.dataValues.playerOneId
//     }

//     // converts board back to string
//     game.dataValues.board = JSON.stringify(board)

//     await game.save()

//     return game

//   }catch (error) {
//     throw new AppError(400, `${error.message}`);
//   }
// }


export const makeMove = async (gameId, playerId, position) => {
  try {
    const game = await db.games.findByPk(gameId);

    if (!game) {
      throw new AppError(404, 'Game not found');
    }

    // Ensure game is in progress
    if (game.status !== GameStatus.In_Progress) {
      throw new AppError(400, "Game is currently not in progress");
    }

    // Ensure it's the current player's turn
    if (game.currentTurn !== playerId) {
      throw new AppError(400, "It's not your turn yet.");
    }

    // Validate position
    if (position < 0 || position > 8) {
      throw new AppError(400, "Invalid move position");
    }

    // Convert the board string back to an array for manipulation
    let board = JSON.parse(game.board);

    // Check if position is already taken
    if (board[position] !== null) {
      throw new AppError(400, "Position already taken");
    }

    // Update the board for the current move
    board[position] = game.currentTurn === game.playerOneId ? 'X' : 'O';

    // Checking win or draw conditions
    const result = checkWinCondition(board);

    if (result === 'X' || result === 'O') {
      game.set({
        status: GameStatus.Finished,
        winner: playerId,
      });
    } else if (result === 'Draw') {
      game.set({
        status: GameStatus.Finished,
        winner: null, // Or however you wish to denote a draw
      });
    } else {
      // Switching turns for the players
      game.set({
        currentTurn: game.currentTurn === game.playerOneId ? game.playerTwoId : game.playerOneId,
      });
    }

    // Update the board and save changes
    game.set({ board: JSON.stringify(board) });
    await game.save();

    return game;

  } catch (error) {
    throw new AppError(400, `${error.message}`);
  }
};
