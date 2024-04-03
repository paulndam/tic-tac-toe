import db from "../models/index.js";
import { AppError } from "../util/errorHandler.js";

export const createPlayer = async ({ name }) => {
  try {

    const checkUserNameExist = await db.players.findOne({where:{name:name}})

    if(checkUserNameExist){
      throw new AppError(400,"Name is already taken. Please enter a different name")
    }

    const newPlayer = await db.players.create({ name });

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