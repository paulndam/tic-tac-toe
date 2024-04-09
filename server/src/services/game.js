import db from "../models/index.js";
import { GameStatus } from "../models/game.js";
import { AppError } from "../util/errorHandler.js";
import { checkWinCondition } from "../util/gameCondition.js";

export const createGame = async (playerId) => {
  try {
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

    if(game.status === GameStatus.Finished){
      throw new AppError(400,"Cannot join finished game")
    }

    if(game.playerTwoId){
      throw new AppError(400,"Game already full")

    }

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


export const makeMove = async (gameId, playerId, position) => {
  try {
    const game = await db.games.findByPk(gameId);

    if (!game) {
      throw new AppError(404, 'Game not found');
    }

    if (game.status !== GameStatus.In_Progress) {
      throw new AppError(400, "Game is currently not in progress");
    }

    if (game.currentTurn !== playerId) {
      throw new AppError(400, "It's not your turn yet.");
    }

    if (position < 0 || position > 8) {
      throw new AppError(400, "Invalid move position");
    }

    let board = JSON.parse(game.board);

    if (board[position] !== null) {
      throw new AppError(400, "Position already taken");
    }

    board[position] = game.currentTurn === game.playerOneId ? 'X' : 'O';

    const result = checkWinCondition(board);
    console.log("result =====>",result)

    if (result === 'X' || result === 'O') {
      game.set({
        status: GameStatus.Finished,
        winner: playerId,
      });
    } else if (result === 'Draw') {
      game.set({
        status: GameStatus.Finished,
        winner: null, 
      });
    } else {
      game.set({
        currentTurn: game.currentTurn === game.playerOneId ? game.playerTwoId : game.playerOneId,
      });
    }

    game.set({ board: JSON.stringify(board) });
    await game.save();

    return game;

  } catch (error) {
    throw new AppError(400, `${error.message}`);
  }
};
