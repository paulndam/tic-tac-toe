
export const GameStatus = {
    Pending : 'pending',
    In_Progress: 'in_progress',
    Finished: 'finished'
}

const gameModel = (sequelize, DataTypes) => {
    const Game = sequelize.define('Game', {
      gameId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      playerOneId: {
        type: DataTypes.UUID,
        allowNull: false, 
        references: {
          model: 'Players',
          key: 'playerId'
        }
      },
      playerTwoId: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
          model: 'Players',
          key: 'playerId'
        }
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: GameStatus.Pending,
      },
      board:{
        type: DataTypes.STRING, //using JSON string for simplicity
        allowNull:false,
        defaultValue: JSON.stringify(Array(9).fill(null)) // initializing empty board
      },
      currentTurn:{
        type: DataTypes.UUID,
        allowNull:true
      },
      winner: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
          model: 'Players',
          key: 'playerId'
        }
      },
    }, {
      timestamps: true 
    });
  
    return Game;
  };
  
  export default gameModel;
  