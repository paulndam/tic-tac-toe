
const playerModel = (sequelize,DataTypes) => {

    const Player = sequelize.define('Player',{
        playerId:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type:  DataTypes.STRING,
            allowNull: false,
        },
        wins:{
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    })

    return Player;
}

export default playerModel