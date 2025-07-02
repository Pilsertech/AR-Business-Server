// Inside your new migration file (e.g., ...-simplify-content-type-schema.cjs)
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the new, single column
    await queryInterface.addColumn('ar_contents', 'experienceType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'marker-model'
    });
    // Remove the old, confusing columns
    await queryInterface.removeColumn('ar_contents', 'contentType');
    await queryInterface.removeColumn('ar_contents', 'assetType');
  },
  down: async (queryInterface, Sequelize) => {
    // This allows you to undo the changes if needed
    await queryInterface.removeColumn('ar_contents', 'experienceType');
    await queryInterface.addColumn('ar_contents', 'contentType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'model'
    });
    await queryInterface.addColumn('ar_contents', 'assetType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '3D Model'
    });
  }
};