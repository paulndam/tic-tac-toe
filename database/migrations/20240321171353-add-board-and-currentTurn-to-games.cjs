'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Games","board",{
      type: Sequelize.STRING,
      allowNull:false,
      defaultValue: JSON.stringify(Array(9).fill(null))
    });
    await queryInterface.addColumn("Games","currentTurn",{
      type: Sequelize.UUID,
      allowNull:true
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Games","board");
    await queryInterface.removeColumn("Games","currentTurn")
  }
};
