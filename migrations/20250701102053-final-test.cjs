'use strict';

module.exports = {
  // The 'up' function runs when you apply the migration.
  up: async (queryInterface, Sequelize) => {
    // Instruction to add the positionX column
    await queryInterface.addColumn('ar_contents', 'positionX', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
    // Instruction to add the positionY column
    await queryInterface.addColumn('ar_contents', 'positionY', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
    // Instruction to add the positionZ column
    await queryInterface.addColumn('ar_contents', 'positionZ', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: -2
    });
  },

  // The 'down' function runs if you need to undo the migration.
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ar_contents', 'positionX');
    await queryInterface.removeColumn('ar_contents', 'positionY');
    await queryInterface.removeColumn('ar_contents', 'positionZ');
  }
};