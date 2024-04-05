import db from "../models/index.js";
import { GameStatus } from "../models/game.js";
import { AppError } from "../util/errorHandler.js";
import { checkWinCondition } from "../util/gameCondition.js";

export const createGame = async (playerId) => {
  try {
    // check if playerId exist in DB
    const idExist = await db.players.findOne({
        where:{playerId:playerId}
    })

    if(!idExist){
        throw new AppError(404,` User with that ID not found in our records`)
    }

    const newGame = await db.games.create({
        playerOneId:playerId,
        status:GameStatus.Pending,
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


export const makeMove = async(gameId,playerId,position) => {
  try{

    const game = await db.games.findByPk(gameId);

    if(!game){
      throw new AppError(404,'Game not found');
    }

    if(game.status !== GameStatus.In_Progress){
      throw new AppError(400,"Game is currently not in progress")
    }

    if(game.currentTurn !== playerId){
      throw new AppError(400,"It's not your turn yet.")
    }

    if(position < 0 || position > 8){
      throw new AppError(400, "Invalid move position")
    }

    // converting board string back to array for manipulation.
    let board = JSON.parse(game.board);

    if(board[position] !== null) throw new AppError(400,"Position already taken")

    // updating board.
    board[position] = game.currentTurn === game.playerOneId ? 'X' : 'O';

    // checking win or draw conditions.
    const result = checkWinCondition(board);

    if(result === 'X' || result === 'O'){
      game.status = GameStatus.Finished;
      game.winner = playerId;
    }else if (result === 'Draw'){
      game.status = GameStatus.Finished
    }else{
      // switching turn for other players;
      game.currentTurn = game.currentTurn === game.playerOneId ? game.playerTwoId : game.playerOneId
    }

    // converts board back to string
    game.board = JSON.stringify(board)

    await game.save()

    return game

  }catch (error) {
    throw new AppError(400, `${error.message}`);
  }
}