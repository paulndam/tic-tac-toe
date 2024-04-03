const moveModel = (sequelize, DataTypes) => {
    const Move = sequelize.define('Move', {
      moveId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: true 
    });
  
    return Move;
  };
  
  export default moveModel;
  