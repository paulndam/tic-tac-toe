'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Games', 'winner', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Players',
        key: 'playerId'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Games', 'winner');

  }
};
