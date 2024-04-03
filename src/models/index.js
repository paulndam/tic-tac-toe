
import dotenv from 'dotenv'
import { Sequelize } from "sequelize";
import playerModel from "./player.js"
import gameModel from "./game.js"
import moveModel from "./move.js"

dotenv.config()

// setting up postgres DB.
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    username: process.env.DATABASE_USERNAME
});


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;


// model/tables

db.players = playerModel(sequelize,Sequelize.DataTypes);
db.games = gameModel(sequelize,Sequelize.DataTypes);
db.moves = moveModel(sequelize,Sequelize.DataTypes);



// Associations;
db.players.hasMany(db.moves,{foreignKey:'playerId'});

// player & games
db.players.hasMany(db.games,{ as:"PlayerOneGames", foreignKey:'playerOneId'});
db.players.hasMany(db.games,{ as:"PlayerTwoGames", foreignKey:'playerTwoId'});

// two players association
db.games.belongsTo(db.players, { as: 'PlayerOne', foreignKey: 'playerOneId' });
db.games.belongsTo(db.players, { as: 'PlayerTwo', foreignKey: 'playerTwoId' });

// games & moves
db.games.hasMany(db.moves,{ foreignKey: 'gameId' });
db.moves.belongsTo(db.games,{ foreignKey: 'gameId' });

// player & moves
db.moves.belongsTo(db.players,{foreignKey:'playerId'})

export default db;