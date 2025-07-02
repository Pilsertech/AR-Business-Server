'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // The 'up' function runs when you apply the migration
  async up (queryInterface, Sequelize) {
    // Instruction to add the assetType column
    await queryInterface.addColumn('ar_contents', 'assetType', {
      type: Sequelize.STRING(20),
      allowNull: true // Or false if it should always be required
    });

    // Instruction to add the contentType column
    await queryInterface.addColumn('ar_contents', 'contentType', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'marker'
    });

    // Instruction to add the positionZ column
    await queryInterface.addColumn('ar_contents', 'positionZ', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: -2
    });
  },

  // The 'down' function runs if you need to undo the migration
  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ar_contents', 'assetType');
    await queryInterface.removeColumn('ar_contents', 'contentType');
    await queryInterface.removeColumn('ar_contents', 'positionZ');
  }
};