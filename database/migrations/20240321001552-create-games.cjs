"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Games", {
      gameId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      playerOneId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Players",
          key: "playerId",
        },
      },

      playerTwoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Players",
          key: "playerId",
        },
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP"
        ),
      },
    });

    
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Games");
  },
};
