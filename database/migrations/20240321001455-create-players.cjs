'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Players',{
      playerId:{
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:true,
        allowNull:false,
      },
      name:{
        type:Sequelize.STRING,
        allowNull: false
      },
      wins:{
        type:Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt:{
        allowNull:false,
        type:Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt:{
        allowNull:false,
        type:Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Players')
  }
};
