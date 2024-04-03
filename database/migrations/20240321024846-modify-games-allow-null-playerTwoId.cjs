'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Games',"playerTwoId",{
      type: Sequelize.UUID,
      allowNull: true, 
      references: {
        model: 'Players',
        key: 'playerId'
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Games','playerTwoId',{
      type: Sequelize.UUID,
      allowNull: false, 
      references: {
        model: 'Players',
        key: 'playerId'
      }
    })
  }
};
