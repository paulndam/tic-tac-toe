import db from "../models/index.js";
import { AppError } from "../util/errorHandler.js";

export const createPlayer = async ({name}) => {
  try {
    console.log("name in the createPlayer service method====>",name)

    const newPlayer = await db.players.create({ name });

    console.log("new player created from service method ====>",newPlayer)

    return newPlayer;
  } catch (error) {
    throw new AppError(500, `${error.message}`);
  }
};


export const allPlayers = async () => {

  try{
    return await db.players.findAll({})

  }catch (error) {
    throw new AppError(500, `${error.message}`);
  }
}

export const playerById = async(playerId) => {
  try{

    return await db.players.findByPk(playerId)

  }catch (error) {
    throw new AppError(500, `${error.message}`);
  }
}